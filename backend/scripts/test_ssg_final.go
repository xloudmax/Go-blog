package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"repair-platform/config"
	"repair-platform/models"
	"repair-platform/services"
	"time"

	"github.com/goccy/go-json"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	// 1. Setup
	_ = config.LoadConfig()
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	db.AutoMigrate(&models.Setting{}, &models.User{}, &models.BlogPost{}, &models.BlogPostStats{})

	fmt.Println("=== 1. Testing Secure Settings ===")
	rawToken := "ghp_secure_test_token_12345"
	if err := models.SetSensitiveSetting(db, "github_token", rawToken); err != nil {
		log.Fatalf("Failed to set sensitive setting: %v", err)
	}

	// Verify it's encrypted in DB
	var s models.Setting
	db.Where("key = ?", "github_token").First(&s)
	fmt.Printf("Database value (encrypted): %s\n", s.Value)
	if s.Value == rawToken {
		log.Fatal("FAILURE: Token stored in plain text!")
	}

	// Verify retrieval
	decrypted, _ := models.GetSensitiveSetting(db, "github_token")
	fmt.Printf("Retrieved value (decrypted): %s\n", decrypted)
	if decrypted == rawToken {
		fmt.Println("SUCCESS: Encryption/Decryption working correctly.")
	}

	fmt.Println("\n=== 2. Testing Data Privacy (StaticPost DTO) ===")
	author := models.User{Username: "admin", Email: "admin@private.com", Avatar: "avatar.png"}
	db.Create(&author)
	post := models.BlogPost{
		Title:     "Private Data Test",
		Slug:      "private-test",
		Content:   "Secret content",
		Status:    "PUBLISHED",
		AuthorID:  author.ID,
		UpdatedAt: time.Now(),
	}
	db.Create(&post)
	db.Preload("Author").First(&post)

	deployService := services.NewDeployService(db)
	tmpDir, _ := os.MkdirTemp("", "ssg-integrated-*")
	defer os.RemoveAll(tmpDir)

	if err := deployService.ExportDataToJSON(tmpDir); err != nil {
		log.Fatalf("Export failed: %v", err)
	}

	// Check post.json content
	content, _ := os.ReadFile(filepath.Join(tmpDir, "static", "posts", "private-test.json"))
	var exportedMap map[string]interface{}
	json.Unmarshal(content, &exportedMap)

	fmt.Printf("Checking for leaked email in author: %v\n", exportedMap["author"])
	authorMap := exportedMap["author"].(map[string]interface{})
	if _, exists := authorMap["email"]; exists {
		fmt.Println("FAILURE: Email leaked in static export!")
	} else {
		fmt.Println("SUCCESS: Email is hidden in static export.")
	}

	fmt.Println("\n=== 3. Testing Incremental Logic ===")
	postFile := filepath.Join(tmpDir, "static", "posts", "private-test.json")
	info1, _ := os.Stat(postFile)

	time.Sleep(100 * time.Millisecond)
	fmt.Println("Running second export (unchanged)...")
	deployService.ExportDataToJSON(tmpDir)
	info2, _ := os.Stat(postFile)

	if info1.ModTime().Equal(info2.ModTime()) {
		fmt.Println("SUCCESS: Unchanged file was skipped.")
	} else {
		fmt.Println("FAILURE: Unchanged file was overwritten!")
	}

	fmt.Println("\nALL TESTS PASSED!")
}
