package main

import (
	"github.com/goccy/go-json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"repair-platform/models"
	"strings"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/schema"
)

func main() {
	// 1. 确定数据库路径
	dbPath := "blog_platform.db"
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		// 如果当前目录没有，尝试上一级目录 (因为可能在 cmd/export_static 下运行)
		dbPath = "../../blog_platform.db"
		if _, err := os.Stat(dbPath); os.IsNotExist(err) {
			// 如果还是没有，尝试 data.db
			dbPath = "data.db"
			if _, err := os.Stat(dbPath); os.IsNotExist(err) {
				log.Fatalf("❌ 错误: 找不到数据库文件 blog_platform.db 或 data.db")
			}
		}
	}

	fmt.Printf("📂 正在使用数据库: %s\n", dbPath)

	// 2. 连接数据库 (必须使用 SingularTable: true)
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	// 3. 准备目标目录
	// 这里假设我们在 backend 目录下运行
	targetDir := "../dist-static/static"
	postsDir := filepath.Join(targetDir, "posts")
	os.MkdirAll(postsDir, 0755)

	// 4. 获取所有已发布文章
	var posts []models.BlogPost
	result := db.Preload("Author").Preload("Stats").Where("status = ?", "PUBLISHED").Find(&posts)
	if result.Error != nil {
		log.Fatalf("❌ 查询文章失败: %v", result.Error)
	}

	if len(posts) == 0 {
		fmt.Println("⚠️ 警告: 数据库中没有已发布的文章")
	}

	// 5. 生成 posts.json
	postsJSON, _ := json.Marshal(posts)
	os.WriteFile(filepath.Join(targetDir, "posts.json"), postsJSON, 0644)

	// 6. 生成个体文章详情
	for _, post := range posts {
		postJSON, _ := json.Marshal(post)
		os.WriteFile(filepath.Join(postsDir, post.Slug+".json"), postJSON, 0644)
	}

	// 7. 生成 dashboard.json
	dashboard := map[string]interface{}{
		"popularPosts": posts,
		"recentPosts":  posts,
		"tags":         extractTags(posts),
	}
	dashboardJSON, _ := json.Marshal(dashboard)
	os.WriteFile(filepath.Join(targetDir, "dashboard.json"), dashboardJSON, 0644)

	fmt.Printf("✅ 成功导出 %d 篇文章到 %s\n", len(posts), targetDir)
}

func extractTags(posts []models.BlogPost) []map[string]interface{} {
	tagMap := make(map[string]int)
	for _, post := range posts {
		tags := strings.Split(post.Tags, ",")
		for _, t := range tags {
			t = strings.TrimSpace(t)
			if t != "" {
				tagMap[t]++
			}
		}
	}
	var tags []map[string]interface{}
	for name, count := range tagMap {
		tags = append(tags, map[string]interface{}{
			"name":  name,
			"count": count,
		})
	}
	return tags
}
