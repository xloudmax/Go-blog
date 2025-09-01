package graph

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"io/ioutil"
	"math/big"
	"os"
	"path/filepath"
	"repair-platform/middleware"
	"repair-platform/models"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GraphQLError 标准 GraphQL 错误结构
type GraphQLError struct {
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}

func (e GraphQLError) Error() string {
	return e.Message
}

// 常用错误定义
var (
	ErrUnauthorized       = GraphQLError{Message: "未授权访问", Code: "UNAUTHORIZED"}
	ErrForbidden          = GraphQLError{Message: "权限不足", Code: "FORBIDDEN"}
	ErrInvalidInput       = GraphQLError{Message: "输入参数无效", Code: "INVALID_INPUT"}
	ErrUserNotFound       = GraphQLError{Message: "用户不存在", Code: "USER_NOT_FOUND"}
	ErrUserExists         = GraphQLError{Message: "用户已存在", Code: "USER_EXISTS"}
	ErrInvalidCredentials = GraphQLError{Message: "用户名或密码错误", Code: "INVALID_CREDENTIALS"}
	ErrEmailNotVerified   = GraphQLError{Message: "邮箱未验证", Code: "EMAIL_NOT_VERIFIED"}
	ErrInternalError      = GraphQLError{Message: "服务器内部错误", Code: "INTERNAL_ERROR"}
)

// 验证码有效期
const VerificationCodeTTL = 15 * time.Minute

// isAuthenticated 检查用户是否已认证
func isAuthenticated(ctx context.Context) bool {
	_, ok := ctx.Value("username").(string)
	return ok
}

// isAdmin 检查用户是否为管理员
func isAdmin(ctx context.Context, db *gorm.DB) bool {
	user, err := getUserFromContext(ctx, db)
	if err != nil {
		return false
	}
	return user.Role == "admin"
}

// getUserFromContext 从上下文中获取当前用户信息
func getUserFromContext(ctx context.Context, db *gorm.DB) (*models.User, error) {
	// 尝试从 Gin 上下文中获取用户信息（通过HTTP请求）
	if ginCtx := getGinContext(ctx); ginCtx != nil {
		if userID, exists := ginCtx.Get("user_id"); exists {
			if id, ok := userID.(uint); ok {
				var user models.User
				if err := db.First(&user, id).Error; err != nil {
					if errors.Is(err, gorm.ErrRecordNotFound) {
						return nil, ErrUserNotFound
					}
					return nil, ErrInternalError
				}
				return &user, nil
			}
		}
	}

	// 回退到原来的逻辑（用于直接GraphQL上下文）
	username, ok := ctx.Value("username").(string)
	if !ok {
		return nil, ErrUnauthorized
	}

	var user models.User
	if err := db.Where("username = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, ErrInternalError
	}

	return &user, nil
}

// getGinContext 从GraphQL上下文中获取Gin上下文
func getGinContext(ctx context.Context) *gin.Context {
	// 从路由中注入的Gin上下文
	if ginCtx, ok := ctx.Value("GinContext").(*gin.Context); ok {
		return ginCtx
	}

	// 其他尝试方式（向后兼容）
	if ginCtx, ok := ctx.Value("GinContextKey").(*gin.Context); ok {
		return ginCtx
	}

	// 尝试通过类型断言获取
	if ginCtx, ok := ctx.(*gin.Context); ok {
		return ginCtx
	}

	return nil
}

// convertToGraphQLUser 转换数据库用户模型为 GraphQL 用户类型
func convertToGraphQLUser(user *models.User) *User {
	var role UserRole
	switch user.Role {
	case "admin":
		role = UserRoleAdmin
	default:
		role = UserRoleUser
	}

	return &User{
		ID:         strconv.FormatUint(uint64(user.ID), 10),
		Username:   user.Username,
		Email:      user.Email,
		Role:       role,
		IsVerified: user.IsVerified,
		CreatedAt:  user.CreatedAt,
		UpdatedAt:  user.UpdatedAt,
	}
}

// strPtr 返回字符串指针
func strPtr(s string) *string {
	return &s
}

// requireAuth 验证用户认证
func requireAuth(ctx context.Context, db *gorm.DB) (*models.User, error) {
	return getUserFromContext(ctx, db)
}

// requireAdmin 验证管理员权限
func requireAdmin(ctx context.Context, db *gorm.DB) (*models.User, error) {
	user, err := getUserFromContext(ctx, db)
	if err != nil {
		return nil, err
	}
	if user.Role != "admin" {
		return nil, ErrForbidden
	}
	return user, nil
}

// generateSecureCode 生成 6 位安全验证码
func generateSecureCode() (string, error) {
	maxValue := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, maxValue)
	if err != nil {
		return "", fmt.Errorf("无法生成安全随机数: %w", err)
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// sendVerificationCode 发送邮件验证码
func sendVerificationCode(to, code string) error {
	logger := middleware.GetLogger()

	// 开发环境下跳过实际邮件发送，只记录日志
	logger.Infow("[开发模式] 验证码", "email", to, "code", code)
	return nil

	// 以下是实际的邮件发送代码（暂时注释）
	/*
		from := "xloudmaxx@gmail.com"
		password := "mbbf hrde wlpk bphe"
		smtpHost := "smtp.gmail.com"
		smtpPort := "587"

		subject := "Subject: 邮箱验证码\n"
		body := fmt.Sprintf("您的验证码是: %s\n有效期为 %d 分钟", code, VerificationCodeTTL/time.Minute)
		msg := fmt.Sprintf("From: %s\nTo: %s\n%s\n\n%s", from, to, subject, body)

		auth := smtp.PlainAuth("", from, password, smtpHost)
		err := smtp.SendMail(fmt.Sprintf("%s:%s", smtpHost, smtpPort), auth, from, []string{to}, []byte(msg))
		if err != nil {
			logger.Errorw("发送邮件失败", "email", to, "error", err)
			return err
		}

		logger.Infow("邮件发送成功", "email", to)
		return nil
	*/
}

// parseID 解析字符串 ID 为 uint
func parseID(id string) (uint, error) {
	parsed, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		return 0, ErrInvalidInput
	}
	return uint(parsed), nil
}

// getDBFromContext 从上下文中获取数据库连接
func getDBFromContext(ctx context.Context) *gorm.DB {
	if db, ok := ctx.Value("db").(*gorm.DB); ok {
		return db
	}
	return nil
}

// intPtr 返回整数指针
func intPtr(i int) *int {
	return &i
}

// convertToGraphQLBlogPost 转换数据库博客模型为 GraphQL 博客类型
func convertToGraphQLBlogPost(post *models.BlogPost) *BlogPost {
	// 转换访问级别
	var accessLevel AccessLevel
	switch post.AccessLevel {
	case "PRIVATE":
		accessLevel = AccessLevelPrivate
	case "RESTRICTED":
		accessLevel = AccessLevelRestricted
	default:
		accessLevel = AccessLevelPublic
	}

	// 转换状态
	var status PostStatus
	switch post.Status {
	case "DRAFT":
		status = PostStatusDraft
	case "ARCHIVED":
		status = PostStatusArchived
	default:
		status = PostStatusPublished
	}

	// 处理标签和分类
	tags := []string{}
	if post.Tags != "" {
		tags = strings.Split(post.Tags, ",")
		// 去除空格
		for i, tag := range tags {
			tags[i] = strings.TrimSpace(tag)
		}
	}

	categories := []string{}
	if post.Categories != "" {
		categories = strings.Split(post.Categories, ",")
		// 去除空格
		for i, category := range categories {
			categories[i] = strings.TrimSpace(category)
		}
	}

	// 读取文件内容（如果有ContentPath）
	content := post.Content
	if post.ContentPath != "" {
		if data, err := ioutil.ReadFile(post.ContentPath); err == nil {
			content = string(data)
		}
	}

	// 处理封面图片 URL
	var coverImageURL *string
	if post.CoverImageURL != "" {
		coverImageURL = &post.CoverImageURL
	}

	// 处理摘录
	var excerpt *string
	if post.Excerpt != "" {
		excerpt = &post.Excerpt
	}

	// 转换统计信息
	var stats *BlogPostStats
	if post.Stats != nil {
		stats = &BlogPostStats{
			ID:           strconv.FormatUint(uint64(post.Stats.ID), 10),
			ViewCount:    post.Stats.ViewCount,
			LikeCount:    post.Stats.LikeCount,
			ShareCount:   post.Stats.ShareCount,
			CommentCount: post.Stats.CommentCount,
			LastViewedAt: post.Stats.LastViewedAt,
			UpdatedAt:    post.Stats.UpdatedAt,
		}
	}

	return &BlogPost{
		ID:            strconv.FormatUint(uint64(post.ID), 10),
		Title:         post.Title,
		Slug:          post.Slug,
		Excerpt:       excerpt,
		Content:       content,
		Tags:          tags,
		Categories:    categories,
		CoverImageURL: coverImageURL,
		AccessLevel:   accessLevel,
		Status:        status,
		PublishedAt:   post.PublishedAt,
		LastEditedAt:  post.LastEditedAt,
		CreatedAt:     post.CreatedAt,
		UpdatedAt:     post.UpdatedAt,
		Author:        convertToGraphQLUser(&post.Author),
		Stats:         stats,
	}
}

// convertToGraphQLBlogPostVersion 转换数据库博客版本模型为 GraphQL 博客版本类型
func convertToGraphQLBlogPostVersion(version *models.BlogPostVersion) *BlogPostVersion {
	var changeLog *string
	if version.ChangeLog != "" {
		changeLog = &version.ChangeLog
	}

	return &BlogPostVersion{
		ID:         strconv.FormatUint(uint64(version.ID), 10),
		VersionNum: version.VersionNum,
		Title:      version.Title,
		Content:    version.Content,
		ChangeLog:  changeLog,
		CreatedAt:  version.CreatedAt,
		CreatedBy:  convertToGraphQLUser(&version.CreatedBy),
	}
}

// saveBlogPostContent 保存博客文章内容到文件
func saveBlogPostContent(content string, basePath string, title string) (string, error) {
	// 确保目录存在
	if err := ensureFolderExists(basePath); err != nil {
		return "", fmt.Errorf("创建目录失败: %w", err)
	}

	// 创建文件名（使用标题作为文件名）
	filename := strings.ReplaceAll(title, " ", "_") + ".md"
	filename = strings.ReplaceAll(filename, "/", "_")
	// 移除其他可能有问题的字符
	filename = strings.ReplaceAll(filename, ":", "_")
	filename = strings.ReplaceAll(filename, "?", "_")
	filename = strings.ReplaceAll(filename, "*", "_")
	filename = strings.ReplaceAll(filename, "|", "_")
	filename = strings.ReplaceAll(filename, "<", "_")
	filename = strings.ReplaceAll(filename, ">", "_")
	filename = strings.ReplaceAll(filename, "\\", "_")

	filePath := filepath.Join(basePath, filename)

	// 写入文件
	err := ioutil.WriteFile(filePath, []byte(content), 0644)
	if err != nil {
		return "", fmt.Errorf("写入文件失败: %w", err)
	}

	return filePath, nil
}

// 文件管理相关常量和函数
const (
	defaultBasePath = "uploads"
	markdownExt     = ".md"
)

// getBasePath 获取基础路径
func getBasePath() string {
	if basePath := os.Getenv("BASE_PATH"); basePath != "" {
		return basePath
	}
	return defaultBasePath
}

// isPathInsideBase 验证路径是否在基础路径内
func isPathInsideBase(path, base string) bool {
	absBase, _ := filepath.Abs(base)
	absPath, _ := filepath.Abs(path)
	return strings.HasPrefix(absPath, absBase)
}

// ensureFolderExists 确保文件夹路径存在
func ensureFolderExists(folderPath string) error {
	return os.MkdirAll(folderPath, os.ModePerm)
}

// isValidFolderName 验证文件夹名称是否有效
func isValidFolderName(name string) bool {
	for _, char := range name {
		if !(char == '_' ||
			(char >= 'a' && char <= 'z') ||
			(char >= 'A' && char <= 'Z') ||
			(char >= '0' && char <= '9') ||
			(char >= 0x4E00 && char <= 0x9FA5)) {
			return false
		}
	}
	return true
}

// convertToGraphQLInviteCode 转换数据库邀请码模型为 GraphQL 邀请码类型
func convertToGraphQLInviteCode(inviteCode *models.InviteCode) *InviteCode {
	var description *string
	if inviteCode.Description != "" {
		description = &inviteCode.Description
	}

	var usedBy *User
	if inviteCode.UsedBy != nil {
		usedBy = convertToGraphQLUser(inviteCode.UsedBy)
	}

	return &InviteCode{
		ID:          strconv.FormatUint(uint64(inviteCode.ID), 10),
		Code:        inviteCode.Code,
		CreatedBy:   convertToGraphQLUser(&inviteCode.CreatedBy),
		UsedBy:      usedBy,
		UsedAt:      inviteCode.UsedAt,
		ExpiresAt:   inviteCode.ExpiresAt,
		MaxUses:     inviteCode.MaxUses,
		CurrentUses: inviteCode.CurrentUses,
		IsActive:    inviteCode.IsActive,
		Description: description,
		CreatedAt:   inviteCode.CreatedAt,
	}
}

// 系统监控相关函数
var startTime = time.Now()

// formatBytes 格式化字节数
func formatBytes(b uint64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := uint64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(b)/float64(div), "KMGTPE"[exp])
}

// getUptime 获取系统运行时间
func getUptime() string {
	uptime := time.Since(startTime)
	days := int(uptime.Hours()) / 24
	hours := int(uptime.Hours()) % 24
	minutes := int(uptime.Minutes()) % 60
	seconds := int(uptime.Seconds()) % 60

	if days > 0 {
		return fmt.Sprintf("%d天%d小时%d分钟%d秒", days, hours, minutes, seconds)
	} else if hours > 0 {
		return fmt.Sprintf("%d小时%d分钟%d秒", hours, minutes, seconds)
	} else if minutes > 0 {
		return fmt.Sprintf("%d分钟%d秒", minutes, seconds)
	} else {
		return fmt.Sprintf("%d秒", seconds)
	}
}
