package routes

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"mime"
	"os"
	"path/filepath"
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

	// 设置上传路由
	setupUploadRoutes(r, db, cfg)

	// 设置健康检查路由
	setupHealthRoutes(r)

	logger.Infow("路由注册完成 - 全面迁移到GraphQL")
}

// setupGraphQLRoutes 设置 GraphQL 路由（唯一接口）
func setupGraphQLRoutes(r *gin.Engine, db *gorm.DB, cfg *config.Config) {
	logger := middleware.GetLogger()
	logger.Infow("设置 GraphQL 路由")

	// 创建 GraphQL resolver
	resolver := graph.NewResolver(db)

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

// setupUploadRoutes 设置文件上传路由
func setupUploadRoutes(r *gin.Engine, db *gorm.DB, cfg *config.Config) {
	logger := middleware.GetLogger()
	logger.Infow("设置文件上传路由")

	// 创建上传目录
	uploadDir := "uploads/avatars"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		logger.Errorw("创建上传目录失败", "error", err)
	}

	// 上传路由组
	upload := r.Group("/api/upload")
	upload.Use(middleware.JWTAuthMiddleware()) // 需要认证
	{
		// 头像上传
		upload.POST("/avatar", func(c *gin.Context) {
			handleAvatarUpload(c, db)
		})
	}

	// 静态文件服务
	r.Static("/uploads", "./uploads")

	logger.Infow("文件上传路由已设置")
}

// generateFileName 生成唯一文件名
func generateFileName(originalName string) string {
	// 生成随机字符串
	bytes := make([]byte, 16)
	rand.Read(bytes)
	randomStr := hex.EncodeToString(bytes)
	
	// 获取文件扩展名
	ext := filepath.Ext(originalName)
	
	// 返回时间戳 + 随机字符串 + 扩展名
	return fmt.Sprintf("%d_%s%s", time.Now().Unix(), randomStr, ext)
}

// validateImageFile 验证图片文件
func validateImageFile(filename string, size int64) error {
	// 检查文件大小（5MB限制）
	maxSize := int64(5 * 1024 * 1024)
	if size > maxSize {
		return fmt.Errorf("文件大小超过限制（5MB）")
	}

	// 检查文件扩展名
	ext := strings.ToLower(filepath.Ext(filename))
	allowedExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".webp": true,
	}

	if !allowedExts[ext] {
		return fmt.Errorf("不支持的文件格式，仅支持: JPG, JPEG, PNG, GIF, WebP")
	}

	return nil
}

// validateMimeType 验证MIME类型
func validateMimeType(file io.Reader) error {
	// 读取文件头部来检测MIME类型
	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return fmt.Errorf("读取文件失败: %v", err)
	}

	// 检测MIME类型
	mimeType := mime.TypeByExtension("") // 通过文件内容检测
	if n > 0 {
		// 使用 http.DetectContentType 检测
		detectedType := ""
		if n >= 8 {
			// 简单的图片文件头检测
			if buffer[0] == 0xFF && buffer[1] == 0xD8 {
				detectedType = "image/jpeg"
			} else if buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47 {
				detectedType = "image/png"
			} else if buffer[0] == 0x47 && buffer[1] == 0x49 && buffer[2] == 0x46 {
				detectedType = "image/gif"
			} else if string(buffer[0:4]) == "RIFF" && string(buffer[8:12]) == "WEBP" {
				detectedType = "image/webp"
			}
		}
		mimeType = detectedType
	}

	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/jpg":  true,
		"image/png":  true,
		"image/gif":  true,
		"image/webp": true,
	}

	if !allowedTypes[mimeType] {
		return fmt.Errorf("不支持的文件类型: %s", mimeType)
	}

	return nil
}

// handleAvatarUpload 处理头像上传
func handleAvatarUpload(c *gin.Context, db *gorm.DB) {
	logger := middleware.GetLogger()

	// 获取当前用户
	user, err := getUserFromRequest(c, db)
	if err != nil {
		c.JSON(401, gin.H{
			"success": false,
			"message": "未授权访问",
			"error":   err.Error(),
		})
		return
	}

	// 获取上传的文件
	file, header, err := c.Request.FormFile("avatar")
	if err != nil {
		logger.Errorw("获取上传文件失败", "error", err)
		c.JSON(400, gin.H{
			"success": false,
			"message": "获取上传文件失败",
			"error":   err.Error(),
		})
		return
	}
	defer file.Close()

	// 验证文件
	if err := validateImageFile(header.Filename, header.Size); err != nil {
		logger.Warnw("文件验证失败", "filename", header.Filename, "size", header.Size, "error", err)
		c.JSON(400, gin.H{
			"success": false,
			"message": "文件验证失败",
			"error":   err.Error(),
		})
		return
	}

	// 验证MIME类型
	if err := validateMimeType(file); err != nil {
		logger.Warnw("MIME类型验证失败", "filename", header.Filename, "error", err)
		c.JSON(400, gin.H{
			"success": false,
			"message": "文件类型验证失败",
			"error":   err.Error(),
		})
		return
	}

	// 重置文件指针
	file.Seek(0, 0)

	// 生成新文件名
	filename := generateFileName(header.Filename)
	filePath := filepath.Join("uploads", "avatars", filename)

	// 创建目标文件
	dst, err := os.Create(filePath)
	if err != nil {
		logger.Errorw("创建目标文件失败", "path", filePath, "error", err)
		c.JSON(500, gin.H{
			"success": false,
			"message": "保存文件失败",
			"error":   err.Error(),
		})
		return
	}
	defer dst.Close()

	// 复制文件内容
	if _, err := io.Copy(dst, file); err != nil {
		logger.Errorw("复制文件失败", "error", err)
		// 删除已创建的文件
		os.Remove(filePath)
		c.JSON(500, gin.H{
			"success": false,
			"message": "保存文件失败",
			"error":   err.Error(),
		})
		return
	}

	// 生成访问URL
	baseURL := c.Request.Host
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	avatarURL := fmt.Sprintf("%s://%s/%s", scheme, baseURL, filePath)

	// 删除旧头像文件（如果存在）
	if user.Avatar != "" && strings.Contains(user.Avatar, "/uploads/avatars/") {
		oldPath := strings.TrimPrefix(user.Avatar, fmt.Sprintf("%s://%s/", scheme, baseURL))
		if oldPath != filePath {
			os.Remove(oldPath)
		}
	}

	logger.Infow("头像上传成功", 
		"user_id", user.ID, 
		"filename", filename, 
		"size", header.Size,
		"url", avatarURL,
	)

	c.JSON(200, gin.H{
		"success": true,
		"message": "头像上传成功",
		"url":     avatarURL,
		"filename": filename,
	})
}