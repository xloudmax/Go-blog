package main

import (
	"log"
	"os"
    "time"
	"repair-platform/config"
	"repair-platform/database"
	"repair-platform/models"

	"github.com/joho/godotenv"
	"gorm.io/gorm"
)

func main() {
	// 加载 .env 文件
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	// 加载配置
	cfg := config.GetConfig()
	
	dbUrl := cfg.DatabaseURL
	dir, _ := os.Getwd()
	log.Printf("Current working directory: %s", dir)
	log.Printf("Attempting to connect to database at: %s", dbUrl)

	// 初始化数据库连接
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}

	createAdmin(db)
}

func createAdmin(db *gorm.DB) {
	username := "admin"
	
    // 生成强密码
    password := generateRandomPassword(16)
    email := "admin@example.com"

	// 检查是否已存在
	var user models.User
	result := db.Where("username = ?", username).First(&user)
	
    if result.Error == nil {
        // 用户存在，重置密码和权限
        log.Printf("Admin user '%s' exists, resetting password and ensuring admin privileges...", username)
        user.Role = "ADMIN"
        user.IsAdmin = true
        user.IsActive = true
        user.IsVerified = true
        
        if err := user.SetPassword(password); err != nil {
            log.Fatalf("Failed to hash password: %v", err)
        }
        
        if err := db.Save(&user).Error; err != nil {
            log.Fatalf("Failed to update admin user: %v", err)
        }
    } else {
        // 创建新用户
        user = models.User{
            Username:   username,
            Email:      email,
            Role:       "admin",
            IsVerified: true,
            IsActive:   true,
            IsAdmin:    true,
        }

        if err := user.SetPassword(password); err != nil {
            log.Fatalf("Failed to hash password: %v", err)
        }

        if err := db.Create(&user).Error; err != nil {
            log.Fatalf("Failed to create admin user: %v", err)
        }
    }

	log.Printf("\n\n")
    log.Printf("=========================================================")
    log.Printf("   ADMIN ACCOUNT MANIPULATION SUCCESSFUL")
    log.Printf("=========================================================")
    log.Printf("   URL:      https://xloudmax.cc")
    log.Printf("   Username: %s", username)
    log.Printf("   Password: %s", password)
    log.Printf("=========================================================")
    log.Printf("\n")
}

func generateRandomPassword(length int) string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    b := make([]byte, length)
    for i := range b {
        // 简单随机为了演示，生产环境建议使用 crypto/rand
        // 这里只是辅助工具，math/rand 配合时间种子足够
        b[i] = charset[time.Now().UnixNano()%int64(len(charset))]
        time.Sleep(1 * time.Nanosecond) // 避免系统时钟不够快导致伪随机重复
    }
    return string(b)
}
