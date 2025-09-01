package database

import (
	"repair-platform/models"

	"gorm.io/gorm"
)

// RunMigrations 执行数据库迁移
func RunMigrations(db *gorm.DB) error {
	// 自动迁移模型
	err := db.AutoMigrate(
		&models.User{},
		&models.BlogPost{},
		&models.BlogPostStats{},
		&models.BlogPostVersion{},
		&models.BlogPostLike{},
		&models.InviteCode{},
	)
	if err != nil {
		return err
	}

	// 创建搜索优化索引
	if err := createSearchIndexes(db); err != nil {
		return err
	}

	return nil
}

// createSearchIndexes 创建搜索相关的数据库索引
func createSearchIndexes(db *gorm.DB) error {
	// 为博客文章创建搜索索引
	indexes := []string{
		// 标题搜索索引
		"CREATE INDEX IF NOT EXISTS idx_blog_post_title ON blog_post(title)",

		// 内容搜索索引（前缀索引，避免索引过大）
		"CREATE INDEX IF NOT EXISTS idx_blog_post_content_prefix ON blog_post(substr(content, 1, 100))",

		// 标签搜索索引
		"CREATE INDEX IF NOT EXISTS idx_blog_post_tags ON blog_post(tags)",

		// 分类搜索索引
		"CREATE INDEX IF NOT EXISTS idx_blog_post_categories ON blog_post(categories)",

		// 状态和访问级别组合索引（用于权限过滤）
		"CREATE INDEX IF NOT EXISTS idx_blog_post_status_access ON blog_post(status, access_level)",

		// 作者ID索引
		"CREATE INDEX IF NOT EXISTS idx_blog_post_author_id ON blog_post(author_id)",

		// 创建时间索引（用于排序）
		"CREATE INDEX IF NOT EXISTS idx_blog_post_created_at ON blog_post(created_at DESC)",

		// 发布时间索引
		"CREATE INDEX IF NOT EXISTS idx_blog_post_published_at ON blog_post(published_at DESC)",

		// 博客文章统计表索引
		"CREATE INDEX IF NOT EXISTS idx_blog_post_stats_blog_post_id ON blog_post_stats(blog_post_id)",
		"CREATE INDEX IF NOT EXISTS idx_blog_post_stats_like_count ON blog_post_stats(like_count DESC)",
		"CREATE INDEX IF NOT EXISTS idx_blog_post_stats_view_count ON blog_post_stats(view_count DESC)",

		// 点赞表索引
		"CREATE INDEX IF NOT EXISTS idx_blog_post_like_post_user ON blog_post_like(blog_post_id, user_id)",
		"CREATE INDEX IF NOT EXISTS idx_blog_post_like_created_at ON blog_post_like(created_at DESC)",

		// 用户表搜索索引
		"CREATE INDEX IF NOT EXISTS idx_user_username ON user(username)",
		"CREATE INDEX IF NOT EXISTS idx_user_email ON user(email)",

		// 复合索引：状态+访问级别+创建时间（常用查询组合）
		"CREATE INDEX IF NOT EXISTS idx_blog_post_status_access_created ON blog_post(status, access_level, created_at DESC)",
	}

	for _, indexSQL := range indexes {
		if err := db.Exec(indexSQL).Error; err != nil {
			// 记录错误但不中断，某些索引可能已存在
			continue
		}
	}

	return nil
}

// DropSearchIndexes 删除搜索索引（用于回滚）
func DropSearchIndexes(db *gorm.DB) error {
	indexes := []string{
		"DROP INDEX IF EXISTS idx_blog_post_title",
		"DROP INDEX IF EXISTS idx_blog_post_content_prefix",
		"DROP INDEX IF EXISTS idx_blog_post_tags",
		"DROP INDEX IF EXISTS idx_blog_post_categories",
		"DROP INDEX IF EXISTS idx_blog_post_status_access",
		"DROP INDEX IF EXISTS idx_blog_post_author_id",
		"DROP INDEX IF EXISTS idx_blog_post_created_at",
		"DROP INDEX IF EXISTS idx_blog_post_published_at",
		"DROP INDEX IF EXISTS idx_blog_post_stats_blog_post_id",
		"DROP INDEX IF EXISTS idx_blog_post_stats_like_count",
		"DROP INDEX IF EXISTS idx_blog_post_stats_view_count",
		"DROP INDEX IF EXISTS idx_blog_post_like_post_user",
		"DROP INDEX IF EXISTS idx_blog_post_like_created_at",
		"DROP INDEX IF EXISTS idx_user_username",
		"DROP INDEX IF EXISTS idx_user_email",
		"DROP INDEX IF EXISTS idx_blog_post_status_access_created",
	}

	for _, indexSQL := range indexes {
		db.Exec(indexSQL)
	}

	return nil
}
