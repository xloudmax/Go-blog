package database

import (
	"errors"
	"fmt"
	"repair-platform/models"
	"strings"

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
		&models.BlogPostComment{},     // 添加评论模型
		&models.BlogPostCommentLike{}, // 添加评论点赞模型
		&models.InviteCode{},
		&models.PasswordResetToken{}, // 添加密码重置令牌模型
		&models.RefreshToken{},       // 添加刷新令牌模型
		&models.SearchQuery{},        // 添加搜索查询记录模型
		&models.Notification{},       // 添加通知模型
		&models.Tag{},                // 添加标签模型
		&models.Category{},           // 添加分类模型
		&models.Setting{},            // 添加设置模型
	)
	if err != nil {
		return err
	}

	// 迁移现有数据的冗余字段到Stats表
	if err := migrateRedundantBlogPostData(db); err != nil {
		return err
	}

	// 创建搜索优化索引
	if err := createSearchIndexes(db); err != nil {
		return err
	}

	// 创建全文搜索索引（如果数据库支持）
	if err := createFullTextSearchIndexes(db); err != nil {
		// 如果不支持全文搜索，记录日志但不中断
		// 禁用全文搜索相关功能
		fmt.Printf("Warning: Full-text search indexes creation failed: %v\n", err)
		fmt.Println("Hint: ensure SQLite is built with FTS5 support (e.g. run with GOFLAGS=\"-tags=sqlite_fts5\" or source backend/set_env.sh)")
	}

	// 创建评论相关索引
	if err := createCommentIndexes(db); err != nil {
		return err
	}

	// 创建通知相关索引
	if err := createNotificationIndexes(db); err != nil {
		return err
	}

	// 迁移标签和分类数据
	if err := migrateTagsAndCategories(db); err != nil {
		return err
	}

	// 初始化知识图谱全文搜索 (Postgres 专用)
	if err := initKnowledgeGraphFTS(db); err != nil {
		fmt.Printf("Warning: Knowledge graph FTS initialization failed: %v\n", err)
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

// createFullTextSearchIndexes 创建全文搜索索引
func createFullTextSearchIndexes(db *gorm.DB) error {
	// 首先尝试创建全文搜索虚拟表
	createFTSTable := `CREATE VIRTUAL TABLE IF NOT EXISTS blog_post_fts USING fts5(
		title,
		content,
		tags,
		categories,
		content='blog_post',
		content_rowid='id'
	)`

	if err := db.Exec(createFTSTable).Error; err != nil {
		// 如果FTS表创建失败，仅记录警告并返回，不要报错导致程序退出
		fmt.Printf("⚠️ 警告: 无法创建全文搜索虚拟表 (可能缺少 FTS5 支持): %v\n", err)
		return nil
	}

	// 对于 SQLite，我们可以创建虚拟表来支持全文搜索
	sqliteFullTextIndexes := []string{
		// 创建触发器保持同步（INSERT）
		`CREATE TRIGGER IF NOT EXISTS blog_post_ai AFTER INSERT ON blog_post BEGIN
			INSERT INTO blog_post_fts(rowid, title, content, tags, categories)
			VALUES (new.id, new.title, new.content, new.tags, new.categories);
		END`,

		// 创建触发器保持同步（DELETE）
		`CREATE TRIGGER IF NOT EXISTS blog_post_ad AFTER DELETE ON blog_post BEGIN
			INSERT INTO blog_post_fts(blog_post_fts, rowid, title, content, tags, categories)
			VALUES('delete', old.id, old.title, old.content, old.tags, old.categories);
		END`,

		// 创建触发器保持同步（UPDATE）
		`CREATE TRIGGER IF NOT EXISTS blog_post_au AFTER UPDATE ON blog_post BEGIN
			INSERT INTO blog_post_fts(blog_post_fts, rowid, title, content, tags, categories)
			VALUES('delete', old.id, old.title, old.content, old.tags, old.categories);
			INSERT INTO blog_post_fts(rowid, title, content, tags, categories)
			VALUES(new.id, new.title, new.content, new.tags, new.categories);
		END`,
	}
	for _, indexSQL := range sqliteFullTextIndexes {
		if err := db.Exec(indexSQL).Error; err != nil {
			// 如果也失败，继续但不报错
			continue
		}
	}

	return nil
}

// createCommentIndexes 创建评论相关的数据库索引
func createCommentIndexes(db *gorm.DB) error {
	// 为博客文章评论创建索引
	indexes := []string{
		// 博客文章ID索引
		"CREATE INDEX IF NOT EXISTS idx_blog_post_comment_blog_post_id ON blog_post_comments(blog_post_id)",

		// 用户ID索引
		"CREATE INDEX IF NOT EXISTS idx_blog_post_comment_user_id ON blog_post_comments(user_id)",

		// 父评论ID索引
		"CREATE INDEX IF NOT EXISTS idx_blog_post_comment_parent_id ON blog_post_comments(parent_id)",

		// 创建时间索引（用于排序）
		"CREATE INDEX IF NOT EXISTS idx_blog_post_comment_created_at ON blog_post_comments(created_at DESC)",

		// 是否已审核索引
		"CREATE INDEX IF NOT EXISTS idx_blog_post_comment_is_approved ON blog_post_comments(is_approved)",

		// 点赞数索引
		"CREATE INDEX IF NOT EXISTS idx_blog_post_comment_like_count ON blog_post_comments(like_count DESC)",

		// 评论点赞表索引
		"CREATE INDEX IF NOT EXISTS idx_blog_post_comment_like_comment_user ON blog_post_comment_likes(blog_post_comment_id, user_id)",
		"CREATE INDEX IF NOT EXISTS idx_blog_post_comment_like_created_at ON blog_post_comment_likes(created_at DESC)",
	}

	for _, indexSQL := range indexes {
		if err := db.Exec(indexSQL).Error; err != nil {
			// 记录错误但不中断，某些索引可能已存在
			continue
		}
	}

	return nil
}

// createNotificationIndexes 创建通知相关的数据库索引
func createNotificationIndexes(db *gorm.DB) error {
	// 为通知创建索引
	indexes := []string{
		// 接收者ID索引（用于查询用户的通知）
		"CREATE INDEX IF NOT EXISTS idx_notification_recipient_id ON notifications(recipient_id)",

		// 接收者ID和已读状态组合索引（用于查询未读通知）
		"CREATE INDEX IF NOT EXISTS idx_notification_recipient_is_read ON notifications(recipient_id, is_read)",

		// 关联文章ID索引
		"CREATE INDEX IF NOT EXISTS idx_notification_related_post_id ON notifications(related_post_id)",

		// 关联评论ID索引
		"CREATE INDEX IF NOT EXISTS idx_notification_related_comment_id ON notifications(related_comment_id)",

		// 关联用户ID索引
		"CREATE INDEX IF NOT EXISTS idx_notification_related_user_id ON notifications(related_user_id)",

		// 创建时间索引（用于排序）
		"CREATE INDEX IF NOT EXISTS idx_notification_created_at ON notifications(created_at DESC)",

		// 通知类型索引
		"CREATE INDEX IF NOT EXISTS idx_notification_type ON notifications(type)",
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
		"DROP INDEX IF EXISTS idx_blog_post_search_vector",
		// 评论相关索引
		"DROP INDEX IF EXISTS idx_blog_post_comment_blog_post_id",
		"DROP INDEX IF EXISTS idx_blog_post_comment_user_id",
		"DROP INDEX IF EXISTS idx_blog_post_comment_parent_id",
		"DROP INDEX IF EXISTS idx_blog_post_comment_created_at",
		"DROP INDEX IF EXISTS idx_blog_post_comment_is_approved",
		"DROP INDEX IF EXISTS idx_blog_post_comment_like_count",
		"DROP INDEX IF EXISTS idx_blog_post_comment_like_comment_user",
		"DROP INDEX IF EXISTS idx_blog_post_comment_like_created_at",
	}

	for _, indexSQL := range indexes {
		db.Exec(indexSQL)
	}

	// 删除全文搜索相关的对象
	fullTextObjects := []string{
		"DROP TRIGGER IF EXISTS blog_post_search_vector_trigger",
		"DROP FUNCTION IF EXISTS update_blog_post_search_vector",
		"ALTER TABLE blog_post DROP COLUMN IF EXISTS search_vector",
		"DROP TABLE IF EXISTS blog_post_fts",
		"DROP TRIGGER IF EXISTS blog_post_ai",
		"DROP TRIGGER IF EXISTS blog_post_ad",
		"DROP TRIGGER IF EXISTS blog_post_au",
	}

	for _, objectSQL := range fullTextObjects {
		db.Exec(objectSQL)
	}

	return nil
}

// migrateRedundantBlogPostData 迁移BlogPost模型中的冗余统计数据到BlogPostStats表
func migrateRedundantBlogPostData(db *gorm.DB) error {
	// 创建一个临时结构体来读取老的BlogPost数据（包含冗余字段）
	type OldBlogPost struct {
		ID        uint `gorm:"primaryKey"`
		ViewCount int  `gorm:"default:0"`
		Likes     int  `gorm:"default:0"`
	}

	// 检查是否存在老的ViewCount和Likes字段
	var hasViewCount, hasLikes bool

	// 检查ViewCount字段是否存在
	if db.Migrator().HasColumn(&models.BlogPost{}, "view_count") {
		hasViewCount = true
	}

	// 检查Likes字段是否存在
	if db.Migrator().HasColumn(&models.BlogPost{}, "likes") {
		hasLikes = true
	}

	// 如果没有这些字段，跳过迁移
	if !hasViewCount && !hasLikes {
		return nil
	}

	// 开始迁移过程
	fmt.Println("开始迁移BlogPost冗余统计数据到BlogPostStats表...")

	// 获取所有BlogPost记录
	var oldPosts []OldBlogPost
	query := db.Table("blog_post").Select("id")

	if hasViewCount {
		query = query.Select("id, view_count")
	}
	if hasLikes {
		if hasViewCount {
			query = query.Select("id, view_count, likes")
		} else {
			query = query.Select("id, likes")
		}
	}

	if err := query.Find(&oldPosts).Error; err != nil {
		return fmt.Errorf("获取BlogPost数据失败: %w", err)
	}

	// 在事务中执行迁移
	return db.Transaction(func(tx *gorm.DB) error {
		for _, oldPost := range oldPosts {
			// 检查是否已存在Stats记录
			var existingStats models.BlogPostStats
			err := tx.Where("blog_post_id = ?", oldPost.ID).First(&existingStats).Error

			if errors.Is(err, gorm.ErrRecordNotFound) {
				// Stats记录不存在，创建新的
				newStats := &models.BlogPostStats{
					BlogPostID:   oldPost.ID,
					ViewCount:    0,
					LikeCount:    0,
					ShareCount:   0,
					CommentCount: 0,
				}

				// 迁移数据
				if hasViewCount {
					newStats.ViewCount = oldPost.ViewCount
				}
				if hasLikes {
					newStats.LikeCount = oldPost.Likes
				}

				if err := tx.Create(newStats).Error; err != nil {
					return fmt.Errorf("创建BlogPostStats记录失败，PostID: %d, Error: %w", oldPost.ID, err)
				}
			} else if err != nil {
				return fmt.Errorf("检查BlogPostStats记录失败，PostID: %d, Error: %w", oldPost.ID, err)
			} else {
				// Stats记录已存在，更新数据（如果老数据有值且新数据为0）
				updateNeeded := false
				if hasViewCount && existingStats.ViewCount == 0 && oldPost.ViewCount > 0 {
					existingStats.ViewCount = oldPost.ViewCount
					updateNeeded = true
				}
				if hasLikes && existingStats.LikeCount == 0 && oldPost.Likes > 0 {
					existingStats.LikeCount = oldPost.Likes
					updateNeeded = true
				}

				if updateNeeded {
					if err := tx.Save(&existingStats).Error; err != nil {
						return fmt.Errorf("更新BlogPostStats记录失败，PostID: %d, Error: %w", oldPost.ID, err)
					}
				}
			}
		}

		// 迁移完成后，删除冗余字段
		if hasViewCount {
			if err := tx.Migrator().DropColumn(&models.BlogPost{}, "view_count"); err != nil {
				fmt.Printf("删除view_count字段失败（可以忽略）: %v\n", err)
			}
		}
		if hasLikes {
			if err := tx.Migrator().DropColumn(&models.BlogPost{}, "likes"); err != nil {
				fmt.Printf("删除likes字段失败（可以忽略）: %v\n", err)
			}
		}

		fmt.Printf("成功迁移了 %d 条BlogPost记录的统计数据\n", len(oldPosts))
		return nil
	})
}

// migrateTagsAndCategories 迁移标签和分类数据
func migrateTagsAndCategories(db *gorm.DB) error {
	// 定义临时结构体读取旧数据
	type OldBlogPost struct {
		ID         uint
		Tags       string
		Categories string
	}

	var posts []OldBlogPost
	// 只查询有标签或分类且未迁移的数据
	if err := db.Table("blog_post").Where("tags != '' OR categories != ''").Scan(&posts).Error; err != nil {
		// 如果表不存在或者列不存在（新库），直接忽略
		return nil
	}

	if len(posts) == 0 {
		return nil
	}

	// 检查是否已经迁移过（通过检查TagsList表是否有数据）
	var count int64
	db.Table("blog_post_tags").Count(&count)
	if count > 0 {
		// 只有在数据量差异很大时才尝试再次迁移，或者直接跳过
		// 这里简单跳过，避免重复处理
		return nil
	}

	fmt.Printf("开始迁移 %d 篇文章的标签和分类数据...\n", len(posts))

	// 遍历文章进行迁移
	return db.Transaction(func(tx *gorm.DB) error {
		for _, p := range posts {
			var post models.BlogPost
			if err := tx.First(&post, p.ID).Error; err != nil {
				continue
			}

			// 迁移标签
			if p.Tags != "" {
				tagNames := strings.Split(p.Tags, ",")
				var tags []models.Tag
				for _, name := range tagNames {
					name = strings.TrimSpace(name)
					if name == "" {
						continue
					}
					var tag models.Tag
					if err := tx.FirstOrCreate(&tag, models.Tag{Name: name}).Error; err != nil {
						return err
					}
					tags = append(tags, tag)
				}
				if len(tags) > 0 {
					if err := tx.Model(&post).Association("TagsList").Replace(tags); err != nil {
						return err
					}
				}
			}

			// 迁移分类
			if p.Categories != "" {
				catNames := strings.Split(p.Categories, ",")
				var cats []models.Category
				for _, name := range catNames {
					name = strings.TrimSpace(name)
					if name == "" {
						continue
					}
					var cat models.Category
					if err := tx.FirstOrCreate(&cat, models.Category{Name: name}).Error; err != nil {
						return err
					}
					cats = append(cats, cat)
				}
				if len(cats) > 0 {
					if err := tx.Model(&post).Association("CategoriesList").Replace(cats); err != nil {
						return err
					}
				}
			}
		}
		fmt.Printf("标签和分类数据迁移完成\n")
		return nil
	})
}

// initKnowledgeGraphFTS 为知识图谱节点初始化全文搜索 (Postgres 专用)
func initKnowledgeGraphFTS(db *gorm.DB) error {
	// 添加生成列和 GIN 索引 (Postgres 语法)
	var count int
	err := db.Raw("SELECT count(*) FROM information_schema.columns WHERE table_name='knowledge_nodes' AND table_schema='public' AND column_name='search_vector'").Scan(&count).Error
	if err != nil {
		return nil
	}

	if count == 0 {
		sql := `
			ALTER TABLE knowledge_nodes 
			ADD COLUMN IF NOT EXISTS search_vector tsvector 
			GENERATED ALWAYS AS (
				setweight(to_tsvector('simple', coalesce(name, '')), 'A') || 
				setweight(to_tsvector('simple', coalesce(description, '')), 'B')
			) STORED;
			CREATE INDEX IF NOT EXISTS idx_nodes_search_vector ON knowledge_nodes USING GIN (search_vector);
		`
		if err := db.Exec(sql).Error; err != nil {
			return fmt.Errorf("failed to create FTS column/index: %w", err)
		}
	}
	return nil
}
