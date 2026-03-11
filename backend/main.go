package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"repair-platform/config"
	"repair-platform/database"
	"repair-platform/middleware"
	"repair-platform/models"
	"repair-platform/routes"
	"repair-platform/services"
	"syscall"
	"time"

	"github.com/gin-contrib/gzip"
	"github.com/joho/godotenv"
	"gorm.io/gorm"

	"github.com/gin-gonic/gin"
)

func main() {
	// 加载 .env 文件
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// 加载配置
	cfg := config.GetConfig()

	// 初始化日志
	initLogger(cfg)
	logger := middleware.GetLogger()

	// 初始化缓存 (如果启用了 Redis)
	if cfg.CacheEnabled && cfg.RedisHost != "" {
		redisCache, err := models.NewRedisCache(cfg.RedisHost, cfg.RedisPort, cfg.RedisPass, cfg.RedisDB)
		if err != nil {
			logger.Warnw("Redis连接失败，将回退到内存缓存", "error", err)
		} else {
			logger.Infow("Redis缓存已初始化", "host", cfg.RedisHost)
			models.SetGlobalCache(redisCache)
			// 更新邮箱验证服务也使用 Redis 以支持多实例同步
			models.SetEmailVerificationService(models.NewEmailVerificationService(redisCache))
		}
	}

	// 确保日志同步、缓存清理
	defer func() {
		models.GetCache().Stop()
		if models.EmailVerificationSvc != nil {
			models.EmailVerificationSvc.Stop()
		}
		if err := logger.Sync(); err != nil {
			logger.Errorw("日志同步失败", "error", err)
		}
	}()

	logger.Infow("服务初始化开始", "environment", cfg.Environment, "port", cfg.Port)

	// 设置 Gin 运行模式
	gin.SetMode(cfg.GetGinMode())

	// 初始化 Gin 引擎，避免默认日志重复输出
	r := gin.New()
	r.Use(gin.Recovery())
	// 启用 Gzip 压缩，显著减少 API 响应传输体积
	r.Use(gzip.Gzip(gzip.DefaultCompression))

	// 注册日志中间件
	r.Use(middleware.LoggingMiddleware())

	// 配置 CORS 中间件
	setupCORS(r, cfg)

	// 初始化数据库
	logger.Infow("初始化数据库连接")
	db, err := database.InitDB(cfg)
	if err != nil {
		logger.Fatalw("数据库连接失败", "error", err)
	}
	logger.Infow("数据库连接已初始化")

	// 强制确保管理员账号存在 (用于测试和桌面端首次启动)
	ensureAdminAccount(db)

	// 初始化 Services
	logger.Infow("初始化服务")
	notionService := services.NewNotionService(db, cfg)
	if notionService == nil {
		logger.Warnw("Notion服务初始化失败 (可能是缺少 API Key)")
	} else {
		logger.Infow("Notion服务已初始化")
	}

	aiService := services.NewAIService()
	logger.Infow("AI服务已初始化")

	// 配置路由
	logger.Infow("配置路由和中间件")
	routes.SetupRoutes(r, db, cfg, notionService, aiService)

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	// 启动服务器
	go startServer(server, cfg)

	// 等待关闭信号并优雅退出
	waitForShutdown(server, db)
}

func ensureAdminAccount(db *gorm.DB) {
	var admin models.User
	now := time.Now()
	// 查找 admin
	err := db.Where("username = ?", "admin").First(&admin).Error

	// 无论是否存在，都执行强制同步逻辑
	targetAdmin := models.User{
		Username:        "admin",
		Email:           "admin@c404.cc",
		Role:            "ADMIN",
		IsAdmin:         true,
		IsVerified:      true,
		IsActive:        true,
		EmailVerifiedAt: &now,
	}
	targetAdmin.SetPassword("admin123456")

	if err != nil {
		// 不存在则创建
		db.Create(&targetAdmin)
		log.Println("Default admin account created: admin / admin123456")
	} else {
		// 存在则更新关键字段，确保好使
		db.Model(&admin).Updates(map[string]interface{}{
			"password":          targetAdmin.Password,
			"role":              "ADMIN",
			"is_admin":          true,
			"is_verified":       true,
			"is_active":         true,
			"email_verified_at": &now,
		})
		log.Println("Existing admin account credentials synchronized.")
	}
}

func initLogger(cfg *config.Config) {
	middleware.InitLogger(cfg)
}

func setupCORS(r *gin.Engine, cfg *config.Config) {
	r.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// 极致兼容模式：如果请求带了 Origin，我们就原样回显
		// 这在开发环境下最稳健，且完美支持带 Cookie/Authorization 的请求
		if origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			// 如果没带 Origin，通常是同源请求或非浏览器请求，回传 * 也是安全的
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, UPDATE, PATCH")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, Accept, Origin, Cache-Control, X-Requested-With, apollo-require-preflight, x-apollo-operation-name, x-apollo-operation-id")
		c.Writer.Header().Set("Access-Control-Expose-Headers", "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Authorization")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		// 拦截所有 OPTIONS 请求并直接返回成功
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})
}

func startServer(server *http.Server, cfg *config.Config) {
	logger := middleware.GetLogger()

	logger.Infow("服务器即将启动", "port", cfg.Port, "environment", cfg.Environment)

	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logger.Fatalw("服务器启动失败", "error", err)
	}

	logger.Infow("服务器已关闭")
}

func waitForShutdown(server *http.Server, db *gorm.DB) {
	logger := middleware.GetLogger()
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	<-c
	logger.Infow("接收到关闭信号，正在清理资源")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Errorw("服务器优雅关闭失败", "error", err)
	}

	database.CloseDB(db)
	logger.Infow("资源清理完成，应用退出")
}
