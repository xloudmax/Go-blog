package main

import (
	"log"
	"time"

	"repair-platform/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"gorm.io/gorm/schema"
)

func main() {
	// Connect to the specific database file used by the app
	dbPath := "blog_platform.db"
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		NamingStrategy: schema.NamingStrategy{
			SingularTable: true,
		},
	})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	log.Println("Connected to database, checking for missing stats...")

	var posts []models.BlogPost
	if err := db.Find(&posts).Error; err != nil {
		log.Fatalf("Failed to fetch posts: %v", err)
	}

	fixedCount := 0
	for _, p := range posts {
		var stats models.BlogPostStats
		if err := db.Where("blog_post_id = ?", p.ID).First(&stats).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// Create Stats
				log.Printf("Missing stats for post: %s (ID: %d). Creating...", p.Title, p.ID)
				newStats := models.BlogPostStats{
					BlogPostID:   p.ID,
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
					fixedCount++
				}
			} else {
				log.Printf("Error checking stats for post %s: %v\n", p.Title, err)
			}
		} else {
			// Stats exist. FORCE UPDATE UpdatedAt to ensure it's not zero/null
			now := time.Now()
			stats.UpdatedAt = now
			if err := db.Save(&stats).Error; err != nil {
				log.Printf("Failed to update stats for post %s: %v\n", p.Title, err)
			} else {
				// log.Printf("Updated stats timestamp for post: %s\n", p.Title)
				fixedCount++
			}
		}
	}

	log.Printf("Fix complete! Fixed %d posts.\n", fixedCount)
}
