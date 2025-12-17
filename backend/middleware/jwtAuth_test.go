package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"repair-platform/config"
	"repair-platform/models"

	"github.com/gin-gonic/gin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// ensure config is loaded with email verification required
func setupConfigForJWTTest() {
	os.Setenv("GIN_MODE", "production")
	os.Setenv("EMAIL_ENABLED", "true")
	config.GetConfig()
}

func TestOptionalJWTMarksUnverified(t *testing.T) {
	setupConfigForJWTTest()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	if err := db.AutoMigrate(&models.User{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}

	user := models.User{Username: "u", Email: "u@example.com", IsVerified: false, Role: "USER"}
	if err := user.SetPassword("Str0ngPass123"); err != nil {
		t.Fatalf("set password: %v", err)
	}
	if err := db.Create(&user).Error; err != nil {
		t.Fatalf("create user: %v", err)
	}

	token, err := models.GenerateJWT(user.ID, user.Username, user.Role, false)
	if err != nil {
		t.Fatalf("generate token: %v", err)
	}

	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set("db", db)
	})
	r.Use(OptionalJWTAuthMiddleware())
	r.GET("/me", func(c *gin.Context) {
		isVerified, _ := c.Get("is_verified")
		c.JSON(http.StatusOK, gin.H{"is_verified": isVerified})
	})

	req := httptest.NewRequest("GET", "/me", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for unverified user, got %d", w.Code)
	}
	if body := w.Body.String(); !strings.Contains(body, "Email not verified") {
		t.Fatalf("expected verification error, got %s", body)
	}
}
