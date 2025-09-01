package main

import (
	"errors"
	"net/http"
	"os"
	"os/signal"
	"repair-platform/config"
	"repair-platform/database"
	"repair-platform/middleware"
	"repair-platform/routes"
	"time"

	"gorm.io/gorm"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 加载配置
	cfg := config.GetConfig()

	// 初始化日志
	initLogger(cfg)
	logger := middleware.GetLogger()

	// 确保日志同步
	defer func() {
		if err := logger.Sync(); err != nil {
			logger.Errorw("日志同步失败", "error", err)
		}
	}()

	logger.Infow("服务初始化开始", "environment", cfg.Environment, "port", cfg.Port)

	// 设置 Gin 运行模式
	gin.SetMode(cfg.GetGinMode())

	// 初始化 Gin 引擎
	r := gin.Default()

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
	defer database.CloseDB(db)
	logger.Infow("数据库连接已初始化")

	// 配置路由
	logger.Infow("配置路由和中间件")
	routes.SetupRoutes(r, db, cfg)

	// 等待关闭信号
	waitForShutdown(db)

	// 启动服务器
	startServer(r, cfg)
}

func initLogger(cfg *config.Config) {
	middleware.InitLogger()
}

func setupCORS(r *gin.Engine, cfg *config.Config) {
	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           24 * time.Hour,
	}))
}

func startServer(r *gin.Engine, cfg *config.Config) {
	logger := middleware.GetLogger()

	logger.Infow("服务器即将启动", "port", cfg.Port, "environment", cfg.Environment)

	if err := r.Run(":" + cfg.Port); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logger.Fatalw("服务器启动失败", "error", err)
	}

	logger.Infow("服务器已关闭")
}

func waitForShutdown(db *gorm.DB) {
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, os.Kill)

	go func() {
		<-c
		middleware.GetLogger().Infow("接收到关闭信号，正在清理资源")
		database.CloseDB(db)
		os.Exit(0)
	}()
}
