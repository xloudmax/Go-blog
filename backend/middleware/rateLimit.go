package middleware

import (
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

var (
	visits   = make(map[string][]time.Time)
	visitsMu sync.Mutex
)

// ConditionalRateLimit 返回一个基于内存 map 的条件限流中间件
// window: 时间窗口长度；maxReq: 窗口内允许的最大请求数
// 管理员用户免限流，仅对指定路径生效
func ConditionalRateLimit(window time.Duration, maxReq int, paths ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		logger := GetLogger()

		// 检查是否为限流路径
		path := c.FullPath()
		shouldLimit := false
		if len(paths) == 0 {
			// 如果没有指定路径，则对所有路径限流
			shouldLimit = true
		} else {
			// 检查当前路径是否在限流列表中
			for _, limitPath := range paths {
				if path == limitPath || strings.HasPrefix(path, limitPath) {
					shouldLimit = true
					break
				}
			}
		}

		if !shouldLimit {
			c.Next()
			return
		}

		// 检查是否为管理员，管理员免限流
		if IsAdmin(c) {
			logger.Infow("Admin user bypassing rate limit", "path", path, "ip", c.ClientIP())
			c.Next()
			return
		}

		ip := c.ClientIP()
		now := time.Now()

		visitsMu.Lock()
		times := visits[ip]

		// 保留窗口内的访问记录
		var recent []time.Time
		for _, t := range times {
			if now.Sub(t) < window {
				recent = append(recent, t)
			}
		}
		recent = append(recent, now)
		visits[ip] = recent
		visitsMu.Unlock()

		if len(recent) > maxReq {
			logger.Warnw("Rate limit exceeded", "ip", ip, "path", path, "requests", len(recent), "window", window, "max", maxReq)
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": fmt.Sprintf("您在 %v 内的访问过于频繁（已超过 %d 次），请稍后再试。", window, maxReq),
				"code":  "RATE_LIMIT_EXCEEDED",
			})
			return
		}

		c.Next()
	}
}

// InMemoryRateLimit 返回一个基于内存 map 的限流中间件。
// 保留原有功能以兼容性，但建议使用 ConditionalRateLimit
func InMemoryRateLimit(window time.Duration, maxReq int) gin.HandlerFunc {
	return ConditionalRateLimit(window, maxReq, "/api/register", "/api/login")
}

// GraphQLRateLimit GraphQL专用限流中间件
func GraphQLRateLimit(window time.Duration, maxReq int) gin.HandlerFunc {
	return ConditionalRateLimit(window, maxReq, "/graphql")
}

// CleanupExpiredVisits 定期清理过期的访问记录
func CleanupExpiredVisits(window time.Duration) {
	ticker := time.NewTicker(window)
	go func() {
		for range ticker.C {
			now := time.Now()
			visitsMu.Lock()
			for ip, times := range visits {
				var recent []time.Time
				for _, t := range times {
					if now.Sub(t) < window {
						recent = append(recent, t)
					}
				}
				if len(recent) == 0 {
					delete(visits, ip)
				} else {
					visits[ip] = recent
				}
			}
			visitsMu.Unlock()
		}
	}()
}
