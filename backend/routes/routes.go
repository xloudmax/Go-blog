package routes

import (
	"context"
	"fmt"
	"repair-platform/config"
	"repair-platform/graph"
	"repair-platform/middleware"
	"repair-platform/models"
	"strings"
	"time"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// SetupRoutes 设置应用程序的路由和中间件（全面迁移到GraphQL）
func SetupRoutes(r *gin.Engine, db *gorm.DB, cfg *config.Config) {
	logger := middleware.GetLogger()
	logger.Infow("开始注册路由")

	// 全局中间件
	r.Use(middleware.LoggingMiddleware()) // 全局日志中间件
	r.Use(func(c *gin.Context) {          // 注入数据库实例
		c.Set("db", db)
		c.Set("config", cfg)
		c.Next()
	})

	// 初始化限流中间件的清理器
	middleware.CleanupExpiredVisits(10 * time.Minute)

	// 设置 GraphQL 路由（唯一接口）
	setupGraphQLRoutes(r, db, cfg)

	// 设置健康检查路由
	setupHealthRoutes(r)

	logger.Infow("路由注册完成 - 全面迁移到GraphQL")
}

// setupGraphQLRoutes 设置 GraphQL 路由（唯一接口）
func setupGraphQLRoutes(r *gin.Engine, db *gorm.DB, cfg *config.Config) {
	logger := middleware.GetLogger()
	logger.Infow("设置 GraphQL 路由")

	// 创建 GraphQL resolver
	resolver := &graph.Resolver{
		DB: db,
	}

	// 创建 GraphQL 服务器
	srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	// 注册 GraphQL 端点 - 添加可选JWT认证中间件
	r.POST("/graphql", middleware.OptionalJWTAuthMiddleware(), func(c *gin.Context) {
		// 将Gin上下文注入到GraphQL上下文中
		ctx := context.WithValue(c.Request.Context(), "GinContext", c)
		c.Request = c.Request.WithContext(ctx)
		srv.ServeHTTP(c.Writer, c.Request)
	})

	// 注册 GraphQL Playground（仅开发环境）
	if cfg.IsDevelopment() {
		r.GET("/graphql", func(c *gin.Context) {
			playground.Handler("GraphQL", "/graphql").ServeHTTP(c.Writer, c.Request)
		})
	}

	logger.Infow("GraphQL 端点已设置", "endpoint", "/graphql")
}

// getUserFromRequest 从请求中获取用户信息
func getUserFromRequest(c *gin.Context, db *gorm.DB) (*models.User, error) {
	// 从 Authorization 头获取 JWT token
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return nil, fmt.Errorf("缺少 Authorization 头")
	}

	// 提取 token
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	if tokenString == "" {
		return nil, fmt.Errorf("无效的 Authorization 头")
	}

	// 验证 token 并获取用户信息
	claims, err := models.ParseJWT(tokenString)
	if err != nil {
		return nil, fmt.Errorf("无效的 token: %w", err)
	}

	// 获取用户 ID
	userID, ok := claims["user_id"].(float64)
	if !ok {
		return nil, fmt.Errorf("无效的用户 ID")
	}

	// 从数据库获取用户
	var user models.User
	if err := db.First(&user, uint(userID)).Error; err != nil {
		return nil, fmt.Errorf("用户不存在: %w", err)
	}

	return &user, nil
}

// setupHealthRoutes 设置健康检查路由
func setupHealthRoutes(r *gin.Engine) {
	logger := middleware.GetLogger()
	logger.Infow("设置健康检查路由")

	health := r.Group("/health")
	{
		// 基本健康检查
		health.GET("/ping", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":  "ok",
				"message": "service is running",
				"time":    time.Now().Unix(),
			})
		})

		// 数据库健康检查
		health.GET("/db", func(c *gin.Context) {
			db, exists := c.Get("db")
			if !exists {
				c.JSON(500, gin.H{"status": "error", "message": "database not available"})
				return
			}

			gormDB := db.(*gorm.DB)
			sqlDB, err := gormDB.DB()
			if err != nil {
				c.JSON(500, gin.H{"status": "error", "message": "database connection error"})
				return
			}

			if err := sqlDB.Ping(); err != nil {
				c.JSON(500, gin.H{"status": "error", "message": "database ping failed"})
				return
			}

			c.JSON(200, gin.H{"status": "ok", "message": "database is healthy"})
		})

		// GraphQL端点健康检查
		health.GET("/graphql", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":   "ok",
				"message":  "GraphQL endpoint is available",
				"endpoint": "/graphql",
				"playground": func() string {
					if gin.Mode() != gin.ReleaseMode {
						return "/graphql/playground"
					}
					return "disabled in production"
				}(),
			})
		})
	}

	logger.Infow("健康检查路由已设置: /health/*")
}