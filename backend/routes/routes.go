package routes

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"repair-platform/config"
	"repair-platform/graph"
	"repair-platform/middleware"
	"repair-platform/models"
	"repair-platform/services"
	"strings"
	"time"

	"github.com/99designs/gqlgen/graphql"
	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"
	"github.com/gin-gonic/gin"
	"github.com/vektah/gqlparser/v2/gqlerror"
	"gorm.io/gorm"
)

// SetupRoutes 设置应用程序的路由和中间件（全面迁移到GraphQL）
func SetupRoutes(r *gin.Engine, db *gorm.DB, cfg *config.Config, notionService *services.NotionService, aiService *services.AIService, graphRAGService *services.GraphRAGService) {
	logger := middleware.GetLogger()
	logger.Infow("开始注册路由")

	// 注入数据库和配置
	r.Use(func(c *gin.Context) {
		c.Set("db", db)
		c.Set("config", cfg)
		c.Next()
	})

	// 注册 DataLoader 中间件
	r.Use(graph.DataLoaderMiddleware(db))

	// 限流（基于配置）
	if cfg.RateLimitEnabled {
		r.Use(middleware.ConditionalRateLimit(time.Minute, cfg.RequestsPerMinute, "/graphql"))
		r.Use(middleware.ConditionalRateLimit(time.Hour, cfg.RequestsPerHour, "/graphql"))
	}

	// 初始化限流中间件的清理器
	middleware.CleanupExpiredVisits(10 * time.Minute)

	// 设置 GraphQL 路由（唯一接口）
	setupGraphQLRoutes(r, db, cfg, notionService, aiService)

	// 设置 GraphRAG 路由
	setupGraphRAGRoutes(r, graphRAGService)

	// 设置上传路由
	setupUploadRoutes(r, db, cfg)

	// 设置健康检查路由
	setupHealthRoutes(r)

	logger.Infow("路由注册完成")
}

type graphSearchRequest struct {
	Query   string `json:"query"`
	MaxHops int    `json:"max_hops"`
}

func setupGraphRAGRoutes(r *gin.Engine, s *services.GraphRAGService) {
	graph := r.Group("/api/graph")
	{
		graph.POST("/search", func(c *gin.Context) {
			var req graphSearchRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			if req.MaxHops <= 0 {
				req.MaxHops = 2 // Default 2 hops
			}

			graphResult, err := s.LocalSearch(c.Request.Context(), req.Query, req.MaxHops)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"query":   req.Query,
				"nodes":   graphResult.Nodes,
				"edges":   graphResult.Edges,
			})
		})

		graph.POST("/global-search", func(c *gin.Context) {
			var req struct {
				Query string `json:"query"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			answer, err := s.GlobalSearch(c.Request.Context(), req.Query)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"query":  req.Query,
				"answer": answer,
			})
		})

		graph.POST("/build-communities", func(c *gin.Context) {
			if err := s.BuildCommunities(c.Request.Context()); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "community building triggered"})
		})

		graph.POST("/stream", func(c *gin.Context) {
			var req struct {
				Query string `json:"query"`
			}
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			stream, err := s.StreamMechanismTree(c.Request.Context(), req.Query)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			defer stream.Close()

			c.Header("Content-Type", "text/event-stream")
			c.Header("Cache-Control", "no-cache")
			c.Header("Connection", "keep-alive")
			c.Header("Transfer-Encoding", "chunked")

			c.Stream(func(w io.Writer) bool {
				_, err := io.Copy(w, stream)
				return err == nil && false // Always false to exit after copy
			})
		})
	}
}

// setupGraphQLRoutes 设置 GraphQL 路由（唯一接口）
func setupGraphQLRoutes(r *gin.Engine, db *gorm.DB, cfg *config.Config, notionService *services.NotionService, aiService *services.AIService) {
	logger := middleware.GetLogger()
	logger.Infow("设置 GraphQL 路由")

	// 创建 GraphQL resolver
	resolver := graph.NewResolver(db, notionService, aiService)

	// 创建 GraphQL 服务器
	srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{Resolvers: resolver}))

	// 添加错误处理和日志记录
	srv.SetErrorPresenter(func(ctx context.Context, e error) *gqlerror.Error {
		err := graphql.DefaultErrorPresenter(ctx, e)
		logger.Errorw("GraphQL错误", "error", err.Message, "path", err.Path)
		return err
	})

	srv.SetRecoverFunc(func(ctx context.Context, err interface{}) error {
		logger.Errorw("GraphQL panic", "error", err)
		return fmt.Errorf("internal server error")
	})

	// 注册 GraphQL 端点 - 添加可选JWT认证中间件
	r.POST("/graphql", middleware.OptionalJWTAuthMiddleware(), func(c *gin.Context) {
		// 将Gin上下文注入到GraphQL上下文中
		ctx := context.WithValue(c.Request.Context(), graph.GinContextKey, c)
		c.Request = c.Request.WithContext(ctx)
		srv.ServeHTTP(c.Writer, c.Request)
	})

	// 注册 GraphQL Playground（开发和测试环境）
	if cfg.IsDevelopment() || cfg.IsTest() {
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

	// 创建上传目录（使用配置的基础路径）
	uploadDir := filepath.Join(cfg.BasePath, "avatars")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		logger.Errorw("创建上传目录失败", "error", err)
	}

	// 上传路由组
	upload := r.Group("/api/upload")
	upload.Use(middleware.JWTAuthMiddleware()) // 需要认证
	if cfg.RateLimitEnabled {
		upload.Use(middleware.ConditionalRateLimit(time.Minute, cfg.RequestsPerMinute))
	}
	{
		// 头像上传
		upload.POST("/avatar", func(c *gin.Context) {
			handleAvatarUpload(c, db, cfg)
		})
	}

	// 静态文件服务
	r.Static("/uploads", cfg.BasePath)

	logger.Infow("文件上传路由已设置")
}

// generateFileName 生成唯一文件名
func generateFileName(ext string) string {
	// 生成随机字符串
	bytes := make([]byte, 16)
	rand.Read(bytes)
	randomStr := hex.EncodeToString(bytes)

	// 返回时间戳 + 随机字符串 + 扩展名
	return fmt.Sprintf("%d_%s%s", time.Now().Unix(), randomStr, ext)
}

// validateImageFile 验证图片文件
func validateImageFile(filename string, size int64, maxSize int64, allowed []string) error {
	// 检查文件大小
	limit := maxSize
	if limit <= 0 {
		limit = int64(5 * 1024 * 1024)
	}
	if size > limit {
		return fmt.Errorf("文件大小超过限制（%dMB）", limit/(1024*1024))
	}

	// 检查文件扩展名
	ext := strings.ToLower(filepath.Ext(filename))
	allowedExts := map[string]bool{}
	for _, v := range allowed {
		v = strings.TrimSpace(strings.ToLower(v))
		if v != "" {
			allowedExts[v] = true
		}
	}
	// fallback 默认图片类型
	if len(allowedExts) == 0 {
		allowedExts[".jpg"] = true
		allowedExts[".jpeg"] = true
		allowedExts[".png"] = true
		allowedExts[".gif"] = true
		allowedExts[".webp"] = true
	}

	if !allowedExts[ext] {
		return fmt.Errorf("不支持的文件格式，仅支持: %s", strings.Join(allowedExtsList(allowedExts), ", "))
	}

	return nil
}

func allowedExtsList(m map[string]bool) []string {
	res := make([]string, 0, len(m))
	for k := range m {
		res = append(res, k)
	}
	return res
}

// validateMimeType 验证MIME类型并返回安全扩展名
func validateMimeType(file io.Reader) (string, error) {
	// 读取文件头部来检测MIME类型
	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return "", fmt.Errorf("读取文件失败: %v", err)
	}

	// 使用 http.DetectContentType 检测
	contentType := http.DetectContentType(buffer[:n])

	// 映射 MIME 类型到安全扩展名
	allowedTypes := map[string]string{
		"image/jpeg": ".jpg",
		"image/png":  ".png",
		"image/gif":  ".gif",
		"image/webp": ".webp",
	}

	ext, allowed := allowedTypes[contentType]
	if !allowed {
		return "", fmt.Errorf("不支持的文件类型: %s", contentType)
	}

	return ext, nil
}

// handleAvatarUpload 处理头像上传
func handleAvatarUpload(c *gin.Context, db *gorm.DB, cfg *config.Config) {
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
	if err := validateImageFile(header.Filename, header.Size, cfg.MaxFileSize, cfg.AllowedFileTypes); err != nil {
		logger.Warnw("文件验证失败", "filename", header.Filename, "size", header.Size, "error", err)
		c.JSON(400, gin.H{
			"success": false,
			"message": "文件验证失败",
			"error":   err.Error(),
		})
		return
	}

	// 验证MIME类型
	safeExt, err := validateMimeType(file)
	if err != nil {
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

	// 生成新文件名 (使用安全扩展名)
	filename := generateFileName(safeExt)
	filePath := filepath.Join(cfg.BasePath, "avatars", filename)

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
		"success":  true,
		"message":  "头像上传成功",
		"url":      avatarURL,
		"filename": filename,
	})
}
