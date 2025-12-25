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

	"github.com/joho/godotenv"
	"gorm.io/gorm"

	"github.com/gin-contrib/cors"
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

	// 初始化 Services
	logger.Infow("初始化服务")
	notionService := services.NewNotionService(db)
	if notionService == nil {
		logger.Warnw("Notion服务初始化失败 (可能是缺少 API Key)")
	} else {
		logger.Infow("Notion服务已初始化")
	}

	// 配置路由
	logger.Infow("配置路由和中间件")
	routes.SetupRoutes(r, db, cfg, notionService)

	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: r,
	}

	// 启动服务器
	go startServer(server, cfg)

	// 等待关闭信号并优雅退出
	waitForShutdown(server, db)
}

func initLogger(cfg *config.Config) {
	middleware.InitLogger(cfg)
}

func setupCORS(r *gin.Engine, cfg *config.Config) {
	corsConfig := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           24 * time.Hour,
	}

	// 开发环境允许所有来源
	if cfg.IsDevelopment() {
		corsConfig.AllowAllOrigins = true
	} else {
		corsConfig.AllowOrigins = cfg.AllowedOrigins
	}

	r.Use(cors.New(corsConfig))
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
