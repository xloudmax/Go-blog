package services

import (
	"repair-platform/models"
	"testing"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

func setupBlogTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if err != nil {
		t.Fatalf("Failed to connect database: %v", err)
	}

	// 自动迁移模式，包括 Tag 和 Join Table
	if err := db.AutoMigrate(
		&models.User{},
		&models.BlogPost{},
		&models.BlogPostStats{},
		&models.Tag{},
		&models.Category{},
		&models.BlogPostVersion{},
		&models.BlogPostLike{},
	); err != nil {
		t.Fatalf("Failed to migrate database: %v", err)
	}

	return db
}

func TestCreatePost(t *testing.T) {
	db := setupBlogTestDB(t)
	service := NewBlogService(db)

	// 创建作者
	author := models.User{Username: "testauthor", Email: "test@example.com", Role: "ADMIN"}
	db.Create(&author)

	// 测试输入
	input := &models.CreatePostInput{
		Title:       "Test Post",
		Content:     "Content of test post",
		Tags:        []string{"Go", "Testing"},
		AccessLevel: "PUBLIC",
		Status:      "PUBLISHED",
	}

	// 执行创建
	post, err := service.CreatePost(input, author.ID)
	if err != nil {
		t.Fatalf("CreatePost failed: %v", err)
	}

	// 验证基本字段
	if post.Title != input.Title {
		t.Errorf("Expected title %s, got %s", input.Title, post.Title)
	}
	if post.Slug == "" {
		t.Error("Excluded slug to be generated")
	}

	// 验证关联统计表是否创建
	var stats models.BlogPostStats
	if err := db.Where("blog_post_id = ?", post.ID).First(&stats).Error; err != nil {
		t.Errorf("Stats not created: %v", err)
	}

	// 验证标签是否正确保存到关联表
	var count int64
	db.Table("blog_post_tags").Where("blog_post_id = ?", post.ID).Count(&count)
	if count != 2 {
		t.Errorf("Expected 2 tags in join table, got %d", count)
	}
}

func TestUpdatePost(t *testing.T) {
	db := setupBlogTestDB(t)
	service := NewBlogService(db)

	author := models.User{Username: "author", Role: "ADMIN"}
	db.Create(&author)

	// 先创建
	input := &models.CreatePostInput{Title: "Original", Content: "Old Content"}
	post, _ := service.CreatePost(input, author.ID)

	// 更新
	newTitle := "Updated Title"
	newContent := "New Content"
	updateInput := &models.UpdatePostInput{
		Title:   &newTitle,
		Content: &newContent,
	}

	updatedPost, err := service.UpdatePost(post.ID, updateInput, author.ID, "ADMIN")
	if err != nil {
		t.Fatalf("UpdatePost failed: %v", err)
	}

	if updatedPost.Title != newTitle {
		t.Errorf("Title not updated")
	}

	// 验证版本历史
	var versions []models.BlogPostVersion
	db.Where("blog_post_id = ?", post.ID).Find(&versions)
	if len(versions) != 1 {
		t.Errorf("Expected 1 version history, got %d", len(versions))
	}
	if versions[0].Content != "Old Content" {
		t.Errorf("Expected version to store old content")
	}
}
