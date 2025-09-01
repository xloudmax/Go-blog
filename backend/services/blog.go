package services

import (
	"errors"
	"fmt"
	"repair-platform/models"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

// BlogService 博客服务
type BlogService struct {
	db *gorm.DB
}

// NewBlogService 创建博客服务实例
func NewBlogService(db *gorm.DB) *BlogService {
	return &BlogService{db: db}
}

// CreatePost 创建博客文章
func (s *BlogService) CreatePost(input *models.CreatePostInput, authorID uint) (*models.BlogPost, error) {
	// 生成slug（简化版）
	slug := generateSlug(input.Title)

	// 检查slug是否已存在
	var existing models.BlogPost
	if err := s.db.Where("slug = ?", slug).First(&existing).Error; err == nil {
		// 如果存在，添加时间戳后缀
		slug = fmt.Sprintf("%s-%d", slug, time.Now().Unix())
	}

	// 创建文章
	post := &models.BlogPost{
		Title:       input.Title,
		Slug:        slug,
		Content:     input.Content,
		AccessLevel: input.AccessLevel,
		Status:      "DRAFT", // 默认为草稿状态
		AuthorID:    authorID,
	}

	// 设置标签和分类
	if len(input.Tags) > 0 {
		post.SetTagsFromArray(input.Tags)
	}
	if len(input.Categories) > 0 {
		post.SetCategoriesFromArray(input.Categories)
	}

	// 设置封面图片
	if input.CoverImageURL != nil {
		post.CoverImageURL = *input.CoverImageURL
	}

	// 开始事务
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 保存文章
	if err := tx.Create(post).Error; err != nil {
		tx.Rollback()
		return nil, models.ErrInternalServerError
	}

	// 创建统计记录
	stats := &models.BlogPostStats{
		BlogPostID: post.ID,
		ViewCount:  0,
		LikeCount:  0,
	}
	if err := tx.Create(stats).Error; err != nil {
		tx.Rollback()
		return nil, models.ErrInternalServerError
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		return nil, models.ErrInternalServerError
	}

	// 重新加载完整数据
	if err := s.db.Preload("Author").Preload("Stats").First(post, post.ID).Error; err != nil {
		return nil, models.ErrInternalServerError
	}

	return post, nil
}

// UpdatePost 更新博客文章
func (s *BlogService) UpdatePost(postID uint, input *models.UpdatePostInput, userID uint, userRole string) (*models.BlogPost, error) {
	// 查找文章
	var post models.BlogPost
	if err := s.db.Preload("Author").First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, models.ErrPostNotFound
		}
		return nil, models.ErrInternalServerError
	}

	// 检查权限（作者或管理员）
	if post.AuthorID != userID && userRole != "admin" {
		return nil, models.ErrForbidden
	}

	// 创建版本历史（简化版）
	// 目前只在有内容变化时创建版本
	if input.Content != nil && *input.Content != post.Content {
		version := &models.BlogPostVersion{
			BlogPostID:  post.ID,
			VersionNum:  s.getNextVersionNumber(postID),
			Title:       post.Title,
			Content:     post.Content,
			ChangeLog:   "Content updated", // 简化版本
			CreatedByID: userID,
		}
		s.db.Create(version)
	}

	// 更新字段
	if input.Title != nil {
		post.Title = *input.Title
	}

	if input.Content != nil {
		post.Content = *input.Content
		now := time.Now()
		post.LastEditedAt = &now
	}

	if input.CoverImageURL != nil {
		post.CoverImageURL = *input.CoverImageURL
	}

	if input.AccessLevel != nil {
		post.AccessLevel = *input.AccessLevel
	}

	// 更新标签和分类
	if len(input.Tags) > 0 {
		post.SetTagsFromArray(input.Tags)
	}
	if len(input.Categories) > 0 {
		post.SetCategoriesFromArray(input.Categories)
	}

	// 保存更新
	if err := s.db.Save(&post).Error; err != nil {
		return nil, models.ErrInternalServerError
	}

	// 重新加载完整数据
	if err := s.db.Preload("Author").Preload("Stats").First(&post, postID).Error; err != nil {
		return nil, models.ErrInternalServerError
	}

	return &post, nil
}

// DeletePost 删除博客文章
func (s *BlogService) DeletePost(postID uint, userID uint, userRole string) error {
	// 查找文章
	var post models.BlogPost
	if err := s.db.First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return models.ErrPostNotFound
		}
		return models.ErrInternalServerError
	}

	// 检查权限（作者或管理员）
	if post.AuthorID != userID && userRole != "admin" {
		return models.ErrForbidden
	}

	// 软删除文章
	if err := s.db.Delete(&post).Error; err != nil {
		return models.ErrInternalServerError
	}

	return nil
}

// PublishPost 发布文章
func (s *BlogService) PublishPost(postID uint, userID uint, userRole string) (*models.BlogPost, error) {
	// 查找文章
	var post models.BlogPost
	if err := s.db.Preload("Author").First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, models.ErrPostNotFound
		}
		return nil, models.ErrInternalServerError
	}

	// 检查权限（作者或管理员）
	if post.AuthorID != userID && userRole != "admin" {
		return nil, models.ErrForbidden
	}

	// 发布文章
	if err := post.Publish(s.db); err != nil {
		return nil, models.ErrInternalServerError
	}

	// 重新加载完整数据
	if err := s.db.Preload("Author").Preload("Stats").First(&post, postID).Error; err != nil {
		return nil, models.ErrInternalServerError
	}

	return &post, nil
}

// ArchivePost 归档文章
func (s *BlogService) ArchivePost(postID uint, userID uint, userRole string) (*models.BlogPost, error) {
	// 查找文章
	var post models.BlogPost
	if err := s.db.Preload("Author").First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, models.ErrPostNotFound
		}
		return nil, models.ErrInternalServerError
	}

	// 检查权限（作者或管理员）
	if post.AuthorID != userID && userRole != "admin" {
		return nil, models.ErrForbidden
	}

	// 归档文章
	if err := post.Archive(s.db); err != nil {
		return nil, models.ErrInternalServerError
	}

	// 重新加载完整数据
	if err := s.db.Preload("Author").Preload("Stats").First(&post, postID).Error; err != nil {
		return nil, models.ErrInternalServerError
	}

	return &post, nil
}

// LikePost 点赞文章
func (s *BlogService) LikePost(postID uint, userID uint) (*models.BlogPost, error) {
	// 查找文章
	var post models.BlogPost
	if err := s.db.Preload("Author").Preload("Stats").First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, models.ErrPostNotFound
		}
		return nil, models.ErrInternalServerError
	}

	// 检查是否已经点赞
	var existingLike models.BlogPostLike
	if err := s.db.Where("blog_post_id = ? AND user_id = ?", postID, userID).First(&existingLike).Error; err == nil {
		return nil, errors.New("已经点赞过了")
	}

	// 在事务中处理点赞
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 创建点赞记录
	like := &models.BlogPostLike{
		BlogPostID: postID,
		UserID:     userID,
	}
	if err := tx.Create(like).Error; err != nil {
		tx.Rollback()
		return nil, models.ErrInternalServerError
	}

	// 更新点赞数
	if err := tx.Model(&post.Stats).UpdateColumn("like_count", gorm.Expr("like_count + ?", 1)).Error; err != nil {
		tx.Rollback()
		return nil, models.ErrInternalServerError
	}

	tx.Commit()

	// 重新加载完整数据
	if err := s.db.Preload("Author").Preload("Stats").First(&post, postID).Error; err != nil {
		return nil, models.ErrInternalServerError
	}

	return &post, nil
}

// UnlikePost 取消点赞文章
func (s *BlogService) UnlikePost(postID uint, userID uint) (*models.BlogPost, error) {
	// 查找文章
	var post models.BlogPost
	if err := s.db.Preload("Author").Preload("Stats").First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, models.ErrPostNotFound
		}
		return nil, models.ErrInternalServerError
	}

	// 查找点赞记录
	var like models.BlogPostLike
	if err := s.db.Where("blog_post_id = ? AND user_id = ?", postID, userID).First(&like).Error; err != nil {
		return nil, errors.New("尚未点赞")
	}

	// 在事务中处理取消点赞
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 删除点赞记录
	if err := tx.Delete(&like).Error; err != nil {
		tx.Rollback()
		return nil, models.ErrInternalServerError
	}

	// 更新点赞数
	if err := tx.Model(&post.Stats).UpdateColumn("like_count", gorm.Expr("like_count - ?", 1)).Error; err != nil {
		tx.Rollback()
		return nil, models.ErrInternalServerError
	}

	tx.Commit()

	// 重新加载完整数据
	if err := s.db.Preload("Author").Preload("Stats").First(&post, postID).Error; err != nil {
		return nil, models.ErrInternalServerError
	}

	return &post, nil
}

// getNextVersionNumber 获取下一个版本号
func (s *BlogService) getNextVersionNumber(postID uint) int {
	var count int64
	s.db.Model(&models.BlogPostVersion{}).Where("blog_post_id = ?", postID).Count(&count)
	return int(count) + 1
}

// generateSlug 生成URL友好的slug
func generateSlug(title string) string {
	// 简单的slug生成逻辑
	slug := strings.ToLower(title)
	slug = strings.ReplaceAll(slug, " ", "-")
	slug = strings.ReplaceAll(slug, "_", "-")

	// 移除特殊字符，只保留字母、数字和连字符
	var result strings.Builder
	for _, r := range slug {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			result.WriteRune(r)
		}
	}

	slug = result.String()

	// 移除连续的连字符
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}

	// 移除开头和结尾的连字符
	slug = strings.Trim(slug, "-")

	// 如果为空，使用时间戳
	if slug == "" {
		slug = "post-" + strconv.FormatInt(time.Now().Unix(), 10)
	}

	return slug
}

// GetPostByID 根据ID获取文章
func (s *BlogService) GetPostByID(postID uint, userID *uint, userRole string) (*models.BlogPost, error) {
	var post models.BlogPost
	if err := s.db.Preload("Author").Preload("Stats").First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, models.ErrPostNotFound
		}
		return nil, models.ErrInternalServerError
	}

	// 检查访问权限
	if !post.CanBeViewedBy(userID, userRole) {
		return nil, models.ErrForbidden
	}

	// 更新浏览数（如果是公开访问）
	if userID != nil && post.Status == "PUBLISHED" {
		s.db.Model(&models.BlogPostStats{}).Where("blog_post_id = ?", postID).UpdateColumn("view_count", gorm.Expr("view_count + ?", 1))
	}

	return &post, nil
}

// GetPostBySlug 根据Slug获取文章
func (s *BlogService) GetPostBySlug(slug string, userID *uint, userRole string) (*models.BlogPost, error) {
	var post models.BlogPost
	if err := s.db.Preload("Author").Preload("Stats").Where("slug = ?", slug).First(&post).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, models.ErrPostNotFound
		}
		return nil, models.ErrInternalServerError
	}

	// 检查访问权限
	if !post.CanBeViewedBy(userID, userRole) {
		return nil, models.ErrForbidden
	}

	// 更新浏览数（如果是公开访问）
	if userID != nil && post.Status == "PUBLISHED" {
		s.db.Model(&models.BlogPostStats{}).Where("blog_post_id = ?", post.ID).UpdateColumn("view_count", gorm.Expr("view_count + ?", 1))
	}

	return &post, nil
}

// GetPosts 获取文章列表
func (s *BlogService) GetPosts(limit, offset int, filter *PostFilter, sort *PostSort, userID *uint, userRole string) ([]*models.BlogPost, error) {
	query := s.db.Preload("Author").Preload("Stats")

	// 应用过滤条件
	if filter != nil {
		if filter.AuthorID != nil {
			query = query.Where("author_id = ?", *filter.AuthorID)
		}
		if filter.Status != nil {
			query = query.Where("status = ?", *filter.Status)
		}
		if filter.AccessLevel != nil {
			query = query.Where("access_level = ?", *filter.AccessLevel)
		}
		if len(filter.Tags) > 0 {
			for _, tag := range filter.Tags {
				query = query.Where("tags LIKE ?", "%"+tag+"%")
			}
		}
		if len(filter.Categories) > 0 {
			for _, category := range filter.Categories {
				query = query.Where("categories LIKE ?", "%"+category+"%")
			}
		}
	}

	// 如果不是管理员，只能看到公开的已发布文章
	if userRole != "admin" {
		if userID != nil {
			// 已登录用户可以看到自己的文章和公开的已发布文章
			query = query.Where("(status = 'PUBLISHED' AND access_level = 'PUBLIC') OR author_id = ?", *userID)
		} else {
			// 未登录用户只能看到公开的已发布文章
			query = query.Where("status = 'PUBLISHED' AND access_level = 'PUBLIC'")
		}
	}

	// 应用排序
	if sort != nil {
		switch sort.Field {
		case "created_at":
			if sort.Direction == "DESC" {
				query = query.Order("created_at DESC")
			} else {
				query = query.Order("created_at ASC")
			}
		case "updated_at":
			if sort.Direction == "DESC" {
				query = query.Order("updated_at DESC")
			} else {
				query = query.Order("updated_at ASC")
			}
		case "title":
			if sort.Direction == "DESC" {
				query = query.Order("title DESC")
			} else {
				query = query.Order("title ASC")
			}
		case "likes":
			query = query.Joins("LEFT JOIN blog_post_stats ON blog_post_stats.blog_post_id = blog_posts.id")
			if sort.Direction == "DESC" {
				query = query.Order("blog_post_stats.like_count DESC")
			} else {
				query = query.Order("blog_post_stats.like_count ASC")
			}
		default:
			query = query.Order("created_at DESC")
		}
	} else {
		query = query.Order("created_at DESC")
	}

	// 应用分页
	var posts []*models.BlogPost
	if err := query.Limit(limit).Offset(offset).Find(&posts).Error; err != nil {
		return nil, models.ErrInternalServerError
	}

	return posts, nil
}

// SearchPosts 搜索文章
func (s *BlogService) SearchPosts(searchQuery string, limit, offset int, userID *uint, userRole string) ([]*models.BlogPost, int64, error) {
	query := s.db.Preload("Author").Preload("Stats")

	// 搜索条件（标题、内容、标签、分类）
	searchPattern := "%" + searchQuery + "%"
	query = query.Where("title LIKE ? OR content LIKE ? OR tags LIKE ? OR categories LIKE ?",
		searchPattern, searchPattern, searchPattern, searchPattern)

	// 权限控制
	if userRole != "admin" {
		if userID != nil {
			query = query.Where("(status = 'PUBLISHED' AND access_level = 'PUBLIC') OR author_id = ?", *userID)
		} else {
			query = query.Where("status = 'PUBLISHED' AND access_level = 'PUBLIC'")
		}
	}

	// 获取总数
	var total int64
	query.Model(&models.BlogPost{}).Count(&total)

	// 获取结果
	var posts []*models.BlogPost
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&posts).Error; err != nil {
		return nil, 0, models.ErrInternalServerError
	}

	return posts, total, nil
}

// GetPopularPosts 获取热门文章（按点赞数排序）
func (s *BlogService) GetPopularPosts(limit int, userID *uint, userRole string) ([]*models.BlogPost, error) {
	// 预加载作者和统计信息
	query := s.db.Preload("Author").Preload("Stats")

	// 权限控制
	if userRole != "admin" {
		if userID != nil {
			query = query.Where("(status = 'PUBLISHED' AND access_level = 'PUBLIC') OR author_id = ?", *userID)
		} else {
			query = query.Where("status = 'PUBLISHED' AND access_level = 'PUBLIC'")
		}
	}

	// 使用 JOIN 查询来按点赞数排序
	// 修复表名问题，使用正确的表名 blog_post 而不是 blog_posts
	query = query.
		Joins("LEFT JOIN blog_post_stats ON blog_post_stats.blog_post_id = blog_post.id").
		Order("COALESCE(blog_post_stats.like_count, 0) DESC, blog_post.created_at DESC")

	var posts []*models.BlogPost
	if err := query.Limit(limit).Find(&posts).Error; err != nil {
		// 添加详细的错误日志
		fmt.Printf("GetPopularPosts query error: %v\n", err)
		return nil, models.ErrInternalServerError
	}

	return posts, nil
}

// GetRecentPosts 获取最新文章
func (s *BlogService) GetRecentPosts(limit int, userID *uint, userRole string) ([]*models.BlogPost, error) {
	query := s.db.Preload("Author").Preload("Stats")

	// 权限控制
	if userRole != "admin" {
		if userID != nil {
			query = query.Where("(status = 'PUBLISHED' AND access_level = 'PUBLIC') OR author_id = ?", *userID)
		} else {
			query = query.Where("status = 'PUBLISHED' AND access_level = 'PUBLIC'")
		}
	}

	var posts []*models.BlogPost
	if err := query.Order("created_at DESC").Limit(limit).Find(&posts).Error; err != nil {
		return nil, models.ErrInternalServerError
	}

	return posts, nil
}

// GetPostVersions 获取文章版本历史
func (s *BlogService) GetPostVersions(postID uint, userID uint, userRole string) ([]*models.BlogPostVersion, error) {
	// 先检查用户是否有权限查看该文章
	var post models.BlogPost
	if err := s.db.First(&post, postID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, models.ErrPostNotFound
		}
		return nil, models.ErrInternalServerError
	}

	// 只有作者或管理员可以查看版本历史
	if post.AuthorID != userID && userRole != "admin" {
		return nil, models.ErrForbidden
	}

	var versions []*models.BlogPostVersion
	if err := s.db.Preload("CreatedBy").Where("blog_post_id = ?", postID).Order("version_num DESC").Find(&versions).Error; err != nil {
		return nil, models.ErrInternalServerError
	}

	return versions, nil
}

// GetTrendingTags 获取热门标签
func (s *BlogService) GetTrendingTags(limit int) ([]string, error) {
	var posts []models.BlogPost
	if err := s.db.Select("tags").Where("status = 'PUBLISHED' AND access_level = 'PUBLIC' AND tags != ''").Find(&posts).Error; err != nil {
		return nil, models.ErrInternalServerError
	}

	// 统计标签出现次数
	tagCount := make(map[string]int)
	for _, post := range posts {
		tags := post.GetTagsArray()
		for _, tag := range tags {
			tagCount[tag]++
		}
	}

	// 排序并返回前N个
	type tagFreq struct {
		tag   string
		count int
	}

	var sortedTags []tagFreq
	for tag, count := range tagCount {
		sortedTags = append(sortedTags, tagFreq{tag: tag, count: count})
	}

	// 简单的冒泡排序（实际项目中可以使用更高效的排序算法）
	for i := 0; i < len(sortedTags)-1; i++ {
		for j := 0; j < len(sortedTags)-i-1; j++ {
			if sortedTags[j].count < sortedTags[j+1].count {
				sortedTags[j], sortedTags[j+1] = sortedTags[j+1], sortedTags[j]
			}
		}
	}

	// 提取标签名
	var result []string
	maxCount := len(sortedTags)
	if limit < maxCount {
		maxCount = limit
	}
	for i := 0; i < maxCount; i++ {
		result = append(result, sortedTags[i].tag)
	}

	return result, nil
}

// PostFilter 文章过滤条件
type PostFilter struct {
	AuthorID    *uint    `json:"author_id,omitempty"`
	Status      *string  `json:"status,omitempty"`
	AccessLevel *string  `json:"access_level,omitempty"`
	Tags        []string `json:"tags,omitempty"`
	Categories  []string `json:"categories,omitempty"`
}

// PostSort 文章排序条件
type PostSort struct {
	Field     string `json:"field"`     // created_at, updated_at, title, likes
	Direction string `json:"direction"` // ASC, DESC
}
