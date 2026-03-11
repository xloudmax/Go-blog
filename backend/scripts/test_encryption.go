package main

import (
	"fmt"
	"log"
	"repair-platform/config"
	"repair-platform/utils"
)

func main() {
	// 初始化配置以便获取 JWTSecret
	_ = config.LoadConfig()

	originalText := "github_pat_11AVW7CMA0p...test_token"
	fmt.Printf("Original: %s\n", originalText)

	// 测试加密
	encrypted, err := utils.Encrypt(originalText)
	if err != nil {
		log.Fatalf("Encryption failed: %v", err)
	}
	fmt.Printf("Encrypted (base64): %s\n", encrypted)

	// 测试解密
	decrypted, err := utils.Decrypt(encrypted)
	if err != nil {
		log.Fatalf("Decryption failed: %v", err)
	}
	fmt.Printf("Decrypted: %s\n", decrypted)

	if originalText == decrypted {
		fmt.Println("SUCCESS: Original and Decrypted match!")
	} else {
		fmt.Println("FAILURE: Mismatch!")
	}
}
