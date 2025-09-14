package models

import (
	"strings"
	"time"

	"gorm.io/gorm"
)

// BlogPost 表示博客文章的模型
type BlogPost struct {
	ID            uint              `gorm:"primaryKey" json:"id"`                                           // 博客文章的唯一标识
	Title         string            `gorm:"not null;index" json:"title"`                                    // 博客文章标题
	Slug          string            `gorm:"unique;not null;index" json:"slug"`                              // URL友好的标识符
	Excerpt       string            `gorm:"type:text" json:"excerpt"`                                       // 摘要
	Content       string            `gorm:"type:longtext;not null" json:"content"`                          // Markdown 内容
	Tags          string            `gorm:"type:text" json:"tags"`                                          // 文章标签，逗号分隔
	Categories    string            `gorm:"type:text" json:"categories"`                                    // 文章分类，逗号分隔
	CoverImageURL string            `gorm:"type:text" json:"cover_image_url"`                               // 封面图片的 URL
	ViewCount     int               `gorm:"default:0" json:"view_count"`                                    // 浏览次数
	Likes         int               `gorm:"default:0" json:"likes"`                                         // 点赞数
	AccessLevel   string            `gorm:"type:varchar(20);not null;default:'PUBLIC'" json:"access_level"` // 访问权限（PUBLIC, PRIVATE, RESTRICTED）
	Status        string            `gorm:"type:varchar(20);not null;default:'DRAFT'" json:"status"`        // 状态（DRAFT, PUBLISHED, ARCHIVED）
	PublishedAt   *time.Time        `json:"published_at,omitempty"`                                         // 发布时间
	LastEditedAt  *time.Time        `json:"last_edited_at,omitempty"`                                       // 最后编辑时间
	AuthorID      uint              `gorm:"not null" json:"author_id"`                                      // 作者 ID，外键关联到用户表
	Author        User              `gorm:"foreignKey:AuthorID" json:"author"`                              // 关联用户表，作者信息
	Versions      []BlogPostVersion `gorm:"foreignKey:BlogPostID" json:"versions,omitempty"`                // 版本历史
	Stats         *BlogPostStats    `gorm:"foreignKey:BlogPostID" json:"stats,omitempty"`                   // 统计信息
	CreatedAt     time.Time         `gorm:"autoCreateTime" json:"created_at"`                               // 创建时间
	UpdatedAt     time.Time         `gorm:"autoUpdateTime" json:"updated_at"`                               // 更新时间
	DeletedAt     gorm.DeletedAt    `gorm:"index" json:"-"`                                                 // 软删除
}

// GetTagsArray 获取标签数组
func (bp *BlogPost) GetTagsArray() []string {
	if bp.Tags == "" {
		return []string{}
	}
	return strings.Split(bp.Tags, ",")
}

// GetCategoriesArray 获取分类数组
func (bp *BlogPost) GetCategoriesArray() []string {
	if bp.Categories == "" {
		return []string{}
	}
	return strings.Split(bp.Categories, ",")
}

// SetTagsFromArray 从数组设置标签
func (bp *BlogPost) SetTagsFromArray(tags []string) {
	bp.Tags = strings.Join(tags, ",")
}

// SetCategoriesFromArray 从数组设置分类
func (bp *BlogPost) SetCategoriesFromArray(categories []string) {
	bp.Categories = strings.Join(categories, ",")
}

// IsPublished 检查文章是否已发布
func (bp *BlogPost) IsPublished() bool {
	return bp.Status == "PUBLISHED" && bp.PublishedAt != nil
}

// CanBeViewedBy 检查指定用户是否可以查看此文章
func (bp *BlogPost) CanBeViewedBy(userID *uint, userRole string) bool {
	// 公开文章，任何人都可以查看
	if bp.AccessLevel == "PUBLIC" && bp.IsPublished() {
		return true
	}

	// 管理员可以查看所有文章
	if userRole == "admin" {
		return true
	}

	// 作者可以查看自己的文章
	if userID != nil && *userID == bp.AuthorID {
		return true
	}

	// 私有文章只有作者和管理员可以查看
	if bp.AccessLevel == "PRIVATE" {
		return false
	}

	// TODO: 实现 RESTRICTED 访问级别的逻辑
	return false
}

// Publish 发布文章
func (bp *BlogPost) Publish(db *gorm.DB) error {
	bp.Status = "PUBLISHED"
	now := time.Now()
	bp.PublishedAt = &now
	bp.LastEditedAt = &now
	return db.Save(bp).Error
}

// Archive 归档文章
func (bp *BlogPost) Archive(db *gorm.DB) error {
	bp.Status = "ARCHIVED"
	now := time.Now()
	bp.LastEditedAt = &now
	return db.Save(bp).Error
}

// CreateBlogPostInput 创建博客文章的输入结构体
type CreateBlogPostInput struct {
	Title         string     `json:"title" binding:"required"`
	Slug          string     `json:"slug"`
	Excerpt       string     `json:"excerpt"`
	Content       string     `json:"content" binding:"required"`
	Tags          []string   `json:"tags"`
	Categories    []string   `json:"categories"`
	CoverImageURL string     `json:"cover_image_url"`
	AccessLevel   string     `json:"access_level"`
	Status        string     `json:"status"`
	PublishAt     *time.Time `json:"publish_at"`
}

// UpdateBlogPostInput 更新博客文章的输入结构体
type UpdateBlogPostInput struct {
	Title         *string  `json:"title"`
	Slug          *string  `json:"slug"`
	Excerpt       *string  `json:"excerpt"`
	Content       *string  `json:"content"`
	Tags          []string `json:"tags"`
	Categories    []string `json:"categories"`
	CoverImageURL *string  `json:"cover_image_url"`
	AccessLevel   *string  `json:"access_level"`
	Status        *string  `json:"status"`
	ChangeLog     string   `json:"change_log"`
}
