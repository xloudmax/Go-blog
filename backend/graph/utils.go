package graph

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"math/big"
	"repair-platform/models"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// 定义 Context Key 类型以避免冲突 (SA1029)
type ContextKey string

const GinContextKey ContextKey = "GinContext"

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
					return nil, fmt.Errorf("数据库查询错误: %w", err)
				}
				return &user, nil
			}
			return nil, fmt.Errorf("用户ID类型错误")
		}
		// 如果Gin上下文中没有user_id，尝试获取username
		if username, exists := ginCtx.Get("username"); exists {
			if name, ok := username.(string); ok {
				var user models.User
				if err := db.Where("username = ?", name).First(&user).Error; err != nil {
					if errors.Is(err, gorm.ErrRecordNotFound) {
						return nil, ErrUserNotFound
					}
					return nil, fmt.Errorf("数据库查询错误: %w", err)
				}
				return &user, nil
			}
			return nil, fmt.Errorf("用户名类型错误")
		}
		return nil, ErrUnauthorized
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
		return nil, fmt.Errorf("数据库查询错误: %w", err)
	}

	return &user, nil
}

// getGinContext 从GraphQL上下文中获取Gin上下文
func getGinContext(ctx context.Context) *gin.Context {
	// 从路由中注入的Gin上下文 (使用自定义 Key)
	if ginCtx, ok := ctx.Value(GinContextKey).(*gin.Context); ok {
		return ginCtx
	}

	// 兼容旧的字符串 Key (如果还有其他地方在使用但未更新)
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
	if user == nil {
		return nil
	}

	var role UserRole
	switch user.Role {
	case "ADMIN":
		role = UserRoleAdmin
	default:
		role = UserRoleUser
	}

	// Convert string fields to string pointers if not empty
	var bio *string
	if user.Bio != "" {
		bio = &user.Bio
	}

	var avatar *string
	if user.Avatar != "" {
		avatar = &user.Avatar
	}

	var lastLoginAt *time.Time
	if user.LastLoginAt != nil {
		lastLoginAt = user.LastLoginAt
	}

	return &User{
		ID:          strconv.FormatUint(uint64(user.ID), 10),
		Username:    user.Username,
		Email:       user.Email,
		Role:        role,
		IsVerified:  user.IsVerified,
		IsActive:    user.IsActive,
		Bio:         bio,
		Avatar:      avatar,
		LastLoginAt: lastLoginAt,
		CreatedAt:   user.CreatedAt,
		UpdatedAt:   user.UpdatedAt,
	}
}

// strPtr 返回字符串指针
func strPtr(s string) *string {
	return &s
}

// requireAdmin 验证管理员权限
func requireAdmin(ctx context.Context, db *gorm.DB) (*models.User, error) {
	user, err := getUserFromContext(ctx, db)
	if err != nil {
		return nil, err
	}
	if user.Role != "ADMIN" {
		return nil, ErrForbidden
	}
	return user, nil
}

// requireVerified 验证已登录且邮箱已验证
func requireVerified(ctx context.Context, db *gorm.DB) (*models.User, error) {
	user, err := getUserFromContext(ctx, db)
	if err != nil {
		return nil, err
	}
	if !user.IsVerified {
		return nil, ErrEmailNotVerified
	}
	return user, nil
}

// requireVerifiedSafe 包装错误信息
func requireVerifiedSafe(ctx context.Context, db *gorm.DB) (*models.User, error) {
	user, err := requireVerified(ctx, db)
	if err != nil {
		return nil, HandleAuthError(err)
	}
	return user, nil
}

// generateSecureRefreshToken 生成安全的刷新令牌
func generateSecureRefreshToken() (string, error) {
	bytes := make([]byte, 32) // 256 bits
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("无法生成安全随机令牌: %w", err)
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// verifyCode 验证验证码
func verifyCode(email, code, codeType string) bool {
	ev := models.GetEmailVerificationService()
	if ev == nil {
		return false
	}
	return ev.VerifyCode(email, code, codeType)
}

// deleteVerificationCode 删除验证码
func deleteVerificationCode(email, codeType string) {
	ev := models.GetEmailVerificationService()
	if ev == nil {
		return
	}
	ev.InvalidateCode(email, codeType)
}

// parseID 解析字符串 ID 为 uint
func parseID(id string) (uint, error) {
	parsed, err := strconv.ParseUint(id, 10, 32)
	if err != nil {
		return 0, ErrInvalidInput
	}
	return uint(parsed), nil
}

// convertToGraphQLBlogPost 转换数据库博客模型为 GraphQL 博客类型
func convertToGraphQLBlogPost(post *models.BlogPost) *BlogPost {
	return convertToGraphQLBlogPostWithUser(post, nil)
}

// convertToGraphQLBlogPostWithUser 转换数据库博客模型为 GraphQL 博客类型，支持用户特定信息
func convertToGraphQLBlogPostWithUser(post *models.BlogPost, currentUser *models.User) *BlogPost {
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
	// 优先使用关联列表
	if len(post.TagsList) > 0 {
		for _, t := range post.TagsList {
			tags = append(tags, t.Name)
		}
	} else if post.Tags != "" {
		// 回退到旧字符串字段
		splitTags := strings.Split(post.Tags, ",")
		for _, tag := range splitTags {
			tags = append(tags, strings.TrimSpace(tag))
		}
	}

	categories := []string{}
	// 优先使用关联列表
	if len(post.CategoriesList) > 0 {
		for _, c := range post.CategoriesList {
			categories = append(categories, c.Name)
		}
	} else if post.Categories != "" {
		// 回退到旧字符串字段
		splitCats := strings.Split(post.Categories, ",")
		for _, cat := range splitCats {
			categories = append(categories, strings.TrimSpace(cat))
		}
	}

	// 直接使用数据库中的内容
	content := post.Content

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

	// 转换统计信息，确保stats总是存在且包含ID
	// 如果 Stats 为 nil，则留空，让 DataLoader 解析器去处理
	var stats *BlogPostStats
	if post.Stats != nil && post.Stats.ID != 0 {
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

	// 默认isLiked为false
	isLiked := false

	// 处理 Author
	var author *User
	if post.Author.ID != 0 {
		author = convertToGraphQLUser(&post.Author)
	}

	return &BlogPost{
		ID:            strconv.FormatUint(uint64(post.ID), 10),
		AuthorID:      strconv.FormatUint(uint64(post.AuthorID), 10),
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
		Author:        author,
		Stats:         stats,
		IsLiked:       isLiked,
	}
}

// ensurePostStats 确保文章有统计记录
func ensurePostStats(db *gorm.DB, postID uint) error {
	var existingStats models.BlogPostStats
	err := db.Where("blog_post_id = ?", postID).First(&existingStats).Error

	// 如果统计记录不存在，创建一个
	if errors.Is(err, gorm.ErrRecordNotFound) {
		stats := &models.BlogPostStats{
			BlogPostID:   postID,
			ViewCount:    0,
			LikeCount:    0,
			ShareCount:   0,
			CommentCount: 0,
		}
		return db.Create(stats).Error
	}

	return err // 返回其他错误，nil表示记录已存在
}

// SetBlogPostIsLiked 设置博客文章的点赞状态
func SetBlogPostIsLiked(graphqlPost *BlogPost, post *models.BlogPost, currentUser *models.User, db *gorm.DB) error {
	if currentUser == nil || post.Stats == nil {
		graphqlPost.IsLiked = false
		return nil
	}

	// 检查用户是否已经点赞了这篇文章
	var existingLike models.BlogPostLike
	err := db.Where("blog_post_id = ? AND user_id = ?", post.ID, currentUser.ID).First(&existingLike).Error
	if err != nil {
		// 没有点赞
		graphqlPost.IsLiked = false
	} else {
		// 已经点赞
		graphqlPost.IsLiked = true
	}

	return nil
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

	var expiresAt time.Time
	if inviteCode.ExpiresAt != nil {
		expiresAt = *inviteCode.ExpiresAt
	} else {
		// 如果没有过期时间，返回一个很远的未来时间表示"永不过期"
		expiresAt = time.Date(2999, 12, 31, 23, 59, 59, 0, time.UTC)
	}

	return &InviteCode{
		ID:          strconv.FormatUint(uint64(inviteCode.ID), 10),
		Code:        inviteCode.Code,
		CreatedBy:   convertToGraphQLUser(&inviteCode.CreatedBy),
		UsedBy:      usedBy,
		UsedAt:      inviteCode.UsedAt,
		ExpiresAt:   expiresAt,
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

// generateInviteCode 生成唯一的邀请码
func generateInviteCode() string {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	const codeLength = 8

	code := make([]byte, codeLength)
	for i := range code {
		randomIndex, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			// 如果加密随机数生成失败，回退到时间戳
			return fmt.Sprintf("INV%d", time.Now().Unix())
		}
		code[i] = charset[randomIndex.Int64()]
	}

	return string(code)
}
