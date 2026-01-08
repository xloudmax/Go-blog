package main

import (
	"fmt"
	"log"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"

	"repair-platform/models"
)

func main() {
	// Load .env
	_ = godotenv.Load()

	// Connect to DB (SQLite)
	dbPath := "blog_platform.db"
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("Connected to database, seeding posts...")

	// Create 5 sample posts
	posts := []models.BlogPost{
		{
			Title:       "The Future of UI Design",
			Slug:        "future-ui-design",
			Content:     "Exploring the new wave of glassmorphism and neomorphism.",
			Excerpt:     "An in-depth look at 2025 design trends including glassmorphism.",
			AuthorID:    1, // Assuming admin is ID 1
			Status:      "PUBLISHED",
			AccessLevel: "PUBLIC",
			CreatedAt:   time.Now(),
			PublishedAt: nowPtr(),
		},
		{
			Title:       "Mastering React Performance",
			Slug:        "react-performance-2025",
			Content:     "Tips and tricks for 60fps animations in React.",
			Excerpt:     "How to optimize your React applications for maximum speed.",
			AuthorID:    1,
			Status:      "PUBLISHED",
			AccessLevel: "PUBLIC",
			CreatedAt:   time.Now().Add(-1 * time.Hour),
			PublishedAt: nowPtr(),
		},
		{
			Title:       "Go vs Rust: A Backend Perspective",
			Slug:        "go-vs-rust-backend",
			Content:     "Comparing the two giants of modern systems programming.",
			Excerpt:     "A balanced comparison of Go and Rust for web services.",
			AuthorID:    1,
			Status:      "PUBLISHED",
			AccessLevel: "PUBLIC",
			CreatedAt:   time.Now().Add(-2 * time.Hour),
			PublishedAt: nowPtr(),
		},
		{
			Title:       "Digital Nomad Lifestyle",
			Slug:        "digital-nomad-guide",
			Content:     "How to travel the world while coding.",
			Excerpt:     "Essential gear and tips for the remote developer.",
			AuthorID:    1,
			Status:      "PUBLISHED",
			AccessLevel: "PUBLIC",
			CreatedAt:   time.Now().Add(-3 * time.Hour),
			PublishedAt: nowPtr(),
		},
		{
			Title:       "Cybersecurity Essentials",
			Slug:        "cybersecurity-101",
			Content:     "Protecting your applications from common vulnerabilities.",
			Excerpt:     "Top 10 security practices every developer should know.",
			AuthorID:    1,
			Status:      "PUBLISHED",
			AccessLevel: "PUBLIC",
			CreatedAt:   time.Now().Add(-4 * time.Hour),
			PublishedAt: nowPtr(),
		},
	}

	for _, p := range posts {
		// Check if exists
		var existingPost models.BlogPost
		result := db.Where("slug = ?", p.Slug).First(&existingPost)

		var postID uint

		if result.Error == nil {
			log.Printf("Post already exists: %s (ID: %d)\n", p.Title, existingPost.ID)
			postID = existingPost.ID
		} else {
			if err := db.Create(&p).Error; err != nil {
				log.Printf("Failed to create post %s: %v\n", p.Title, err)
				continue
			} else {
				log.Printf("Created post: %s (ID: %d)\n", p.Title, p.ID)
				postID = p.ID
			}
		}

		// Ensure Stats exist
		var stats models.BlogPostStats
		if err := db.Where("blog_post_id = ?", postID).First(&stats).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// Create Stats
				newStats := models.BlogPostStats{
					BlogPostID:   postID,
					ViewCount:    0,
					LikeCount:    0,
					ShareCount:   0,
					CommentCount: 0,
					CreatedAt:    time.Now(),
					UpdatedAt:    time.Now(),
				}
				if err := db.Create(&newStats).Error; err != nil {
					log.Printf("Failed to create stats for post %s: %v\n", p.Title, err)
				} else {
					log.Printf("Created stats for post: %s\n", p.Title)
				}
			} else {
				log.Printf("Error checking stats for post %s: %v\n", p.Title, err)
			}
		} else {
			// Stats exist, update updated_at just in case
			// db.Model(&stats).Update("updated_at", time.Now())
		}
	}

	fmt.Println("Seeding complete!")
}

func nowPtr() *time.Time {
	t := time.Now()
	return &t
}
