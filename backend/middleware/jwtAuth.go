package middleware

import (
	"context"
	"errors"
	"net/http"
	"repair-platform/config"
	"repair-platform/models"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// 定义 JWT 密钥获取函数
func getJWTSecret() []byte {
	cfg := config.GetConfig()
	return []byte(cfg.JWTSecret)
}

// JWTAuthMiddleware 验证 JWT 并提取用户信息，检查 token 是否过期、签名是否正确
func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		logger := GetLogger()

		// 从请求头中获取 Authorization 字段，预期格式 "Bearer <token>"
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			logger.Warnw("Authorization token not provided or invalid", "header", authHeader)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token not provided or invalid"})
			c.Abort()
			return
		}

		// 提取实际的 token 字符串
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// 解析 token，回调函数用于验证签名方法及返回验证密钥
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// 确保使用 HMAC 签名方法
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				logger.Errorw("Unexpected signing method", "method", token.Header["alg"])
				return nil, errors.New("unexpected signing method") // 修复：使用标准error
			}
			return getJWTSecret(), nil
		})
		if err != nil || !token.Valid {
			logger.Errorw("Invalid or expired token", "error", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// 提取 token 中的 claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || !token.Valid {
			logger.Errorw("Invalid JWT claims", "claims", token.Claims)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid JWT claims"})
			c.Abort()
			return
		}

		// 检查必需的 claim：user_id, username 和 role
		userIDFloat, userIDOk := claims["user_id"].(float64)
		username, usernameOk := claims["username"]
		role, roleOk := claims["role"]

		if !userIDOk {
			logger.Warnw("User ID not found in token", "claims", claims)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
			c.Abort()
			return
		}
		if !usernameOk {
			logger.Warnw("Username not found in token", "claims", claims)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Username not found in token"})
			c.Abort()
			return
		}
		if !roleOk {
			logger.Warnw("Role not found in token", "claims", claims)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Role not found in token"})
			c.Abort()
			return
		}

		// 可选：检查 token 是否过期（若包含 exp 字段）
		if exp, ok := claims["exp"].(float64); ok {
			if int64(exp) < time.Now().Unix() {
				logger.Warnw("Token expired", "exp", exp)
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Token expired"})
				c.Abort()
				return
			}
		}

		// 存储用户信息到上下文，供后续处理中使用
		userID := uint(userIDFloat)
		c.Set("user_id", userID)
		c.Set("username", username)
		c.Set("role", role)
		logger.Infow("JWT token validated", "user_id", userID, "username", username, "role", role)

		// 继续处理请求
		c.Next()
	}
}

// OptionalJWTAuthMiddleware 可选的JWT认证中间件，如果提供了token则验证，否则继续处理
func OptionalJWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		logger := GetLogger()

		// 从请求头中获取 Authorization 字段
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			// 没有提供token，直接继续处理
			c.Next()
			return
		}

		// 提取实际的 token 字符串
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// 解析 token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method") // 修复：使用标准error
			}
			return getJWTSecret(), nil
		})

		if err != nil || !token.Valid {
			// token无效，记录警告但继续处理
			logger.Warnw("Invalid optional token provided", "error", err)
			c.Next()
			return
		}

		// 提取 token 中的 claims
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			if userIDFloat, userIDOk := claims["user_id"].(float64); userIDOk {
				userID := uint(userIDFloat)
				c.Set("user_id", userID)
			}
			if username, usernameOk := claims["username"]; usernameOk {
				c.Set("username", username)
			}
			if role, roleOk := claims["role"]; roleOk {
				c.Set("role", role)
			}
			logger.Infow("Optional JWT token validated", "username", claims["username"], "role", claims["role"])
		}

		// 继续处理请求
		c.Next()
	}
}

// GetUserFromContext 从Gin上下文中获取当前用户信息
func GetUserFromContext(c *gin.Context) (userID uint, username string, role string, exists bool) {
	userIDRaw, userIDExists := c.Get("user_id")
	usernameRaw, usernameExists := c.Get("username")
	roleRaw, roleExists := c.Get("role")

	if !userIDExists || !usernameExists || !roleExists {
		return 0, "", "", false
	}

	userID, userIDOk := userIDRaw.(uint)
	username, usernameOk := usernameRaw.(string)
	role, roleOk := roleRaw.(string)

	if !userIDOk || !usernameOk || !roleOk {
		return 0, "", "", false
	}

	return userID, username, role, true
}

// IsAdmin 检查当前用户是否为管理员
func IsAdmin(c *gin.Context) bool {
	_, _, role, exists := GetUserFromContext(c)
	return exists && (role == "admin" || role == "ADMIN")
}

// GetUserIDFromContext 从GraphQL上下文中获取用户ID
func GetUserIDFromContext(ctx context.Context) (*uint, error) {
	if ginCtx, ok := ctx.(*gin.Context); ok {
		if userID, exists := ginCtx.Get("user_id"); exists {
			if id, ok := userID.(uint); ok {
				return &id, nil
			}
		}
	}
	return nil, models.ErrUnauthorized
}

// GetUserRoleFromContext 从GraphQL上下文中获取用户角色
func GetUserRoleFromContext(ctx context.Context) (string, error) {
	if ginCtx, ok := ctx.(*gin.Context); ok {
		if role, exists := ginCtx.Get("role"); exists {
			if r, ok := role.(string); ok {
				return r, nil
			}
		}
	}
	return "", models.ErrUnauthorized
}
