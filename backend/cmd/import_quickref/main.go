package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"repair-platform/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

func main() {
	// 1. 确定数据库路径
	dbPath := "../../blog_platform.db"
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		dbPath = "blog_platform.db"
		if _, err := os.Stat(dbPath); os.IsNotExist(err) {
			log.Fatalf("❌ 找不到数据库文件")
		}
	}

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	// 2. 找到管理员账户
	var admin models.User
	if err := db.Where("username = ?", "admin").First(&admin).Error; err != nil {
		log.Fatalf("❌ 找不到管理员账户，请先运行主程序初始化管理员: %v", err)
	}

	// 3. 读取 reference/docs 目录
	docsDir := "../../../reference/docs"
	if _, err := os.Stat(docsDir); os.IsNotExist(err) {
		// 如果不在 cmd/seeder 目录下运行，尝试其他相对路径
		docsDir = "../../reference/docs"
	}

	files, err := os.ReadDir(docsDir)
	if err != nil {
		log.Fatalf("❌ 无法读取文档目录 %s: %v", docsDir, err)
	}

	importedCount := 0

	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".md") {
			continue
		}

		filePath := filepath.Join(docsDir, file.Name())
		contentBytes, err := os.ReadFile(filePath)
		if err != nil {
			log.Printf("⚠️ 无法读取文件 %s: %v", file.Name(), err)
			continue
		}

		content := string(contentBytes)
		
		// 从文件名生成标题和 Slug
		baseName := strings.TrimSuffix(file.Name(), ".md")
		title := strings.ReplaceAll(baseName, "-", " ")
		title = strings.Title(title) // 简单首字母大写
		slug := "quickref-" + baseName

		// 检查是否已经存在
		var existing models.BlogPost
		if err := db.Where("slug = ?", slug).First(&existing).Error; err == nil {
			log.Printf("⏭️ 跳过已存在的速查表: %s", title)
			continue
		}

		// 创建文章
		post := models.BlogPost{
			Title:     title,
			Slug:      slug,
			Content:   content,
			Excerpt:   fmt.Sprintf("%s 相关的快速开发速查表与备忘录。", title),
			AuthorID:  admin.ID,
			Status:    "PUBLISHED",
			Tags:      "QuickRef,速查表," + title,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		if err := db.Create(&post).Error; err != nil {
			log.Printf("❌ 导入失败 %s: %v", title, err)
		} else {
			importedCount++
			fmt.Printf("✅ 成功导入: %s\n", title)
		}
	}

	fmt.Printf("\n🎉 导入完成！共导入 %d 篇速查表。\n", importedCount)
}
