package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"repair-platform/models"
	"repair-platform/services"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	// 1. 设置测试数据库
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	// 迁移模型
	db.AutoMigrate(&models.User{}, &models.BlogPost{}, &models.BlogPostStats{})

	// 创建测试数据
	author := models.User{Username: "testuser", Email: "test@example.com"}
	db.Create(&author)

	post := models.BlogPost{
		Title:     "Test Post",
		Slug:      "test-post",
		Content:   "Content",
		Status:    "PUBLISHED",
		AuthorID:  author.ID,
		UpdatedAt: time.Now().Add(-1 * time.Hour), // 一小时前
	}
	db.Create(&post)

	deployService := services.NewDeployService(db)
	tmpDir, _ := os.MkdirTemp("", "ssg-test-*")
	defer os.RemoveAll(tmpDir)

	fmt.Println("Target Dir:", tmpDir)

	// 2. 第一次导出
	fmt.Println("--- First Export ---")
	if err := deployService.ExportDataToJSON(tmpDir); err != nil {
		log.Fatalf("First export failed: %v", err)
	}

	postFile := filepath.Join(tmpDir, "static", "posts", "test-post.json")
	info1, _ := os.Stat(postFile)
	fmt.Printf("File created at: %v\n", info1.ModTime())

	// 等待一秒以确保时间戳有变化（如果重新写入的话）
	time.Sleep(1 * time.Second)

	// 3. 第二次导出 (应该跳过)
	fmt.Println("--- Second Export (Should skip) ---")
	if err := deployService.ExportDataToJSON(tmpDir); err != nil {
		log.Fatalf("Second export failed: %v", err)
	}

	info2, _ := os.Stat(postFile)
	fmt.Printf("File mod time after second export: %v\n", info2.ModTime())

	if info1.ModTime().Equal(info2.ModTime()) {
		fmt.Println("SUCCESS: File was SKIPPED as expected!")
	} else {
		fmt.Println("FAILURE: File was OVERWRITTEN!")
	}

	// 4. 更新文章并第三次导出 (应该更新)
	fmt.Println("--- Third Export (Should update) ---")
	db.Model(&post).Update("updated_at", time.Now())

	if err := deployService.ExportDataToJSON(tmpDir); err != nil {
		log.Fatalf("Third export failed: %v", err)
	}

	info3, _ := os.Stat(postFile)
	fmt.Printf("File mod time after third export: %v\n", info3.ModTime())

	if info3.ModTime().After(info2.ModTime()) {
		fmt.Println("SUCCESS: File was UPDATED as expected!")
	} else {
		fmt.Println("FAILURE: File was NOT updated!")
	}
}
