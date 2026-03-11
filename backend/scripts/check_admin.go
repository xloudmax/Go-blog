package main

import (
	"fmt"
	"log"
	"repair-platform/config"
	"repair-platform/database"
	"repair-platform/models"
)

func main() {
	cfg := config.GetConfig()
	db, err := database.InitDB(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}

	var admin models.User
	err = db.Where("username = ?", "admin").First(&admin).Error
	if err != nil {
		fmt.Println("Admin user NOT found!")
		return
	}

	fmt.Printf("User: %s\n", admin.Username)
	fmt.Printf("Role: %s\n", admin.Role)
	fmt.Printf("IsAdmin: %v\n", admin.IsAdmin)
	fmt.Printf("IsActive: %v\n", admin.IsActive)
}
