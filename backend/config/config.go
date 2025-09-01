package config

import (
	"os"
	"strconv"
	"strings"
	"sync"
)

// 全局配置实例
var (
	configInstance *Config
	configOnce     sync.Once
)

// Config 应用配置
type Config struct {
	// 基础配置
	Environment string
	Port        string
	LogLevel    string

	// 数据库配置
	DatabaseURL string

	// JWT 配置
	JWTSecret      string
	BcryptCost     int
	SessionTimeout string
	RefreshTimeout string

	// 邮件配置
	EmailEnabled bool
	SMTPHost     string
	SMTPPort     string
	SMTPUsername string
	SMTPPassword string

	// CORS 配置
	AllowedOrigins []string

	// 文件上传配置
	BasePath         string
	MaxFileSize      int64
	AllowedFileTypes []string

	// 限流配置
	RateLimitEnabled  bool
	RequestsPerMinute int
	RequestsPerHour   int

	// 缓存配置
	CacheEnabled bool
	CacheTTL     string
}

// LoadConfig 加载应用配置
func LoadConfig() *Config {
	return &Config{
		// 基础配置
		Environment: getEnv("GIN_MODE", "development"),
		Port:        getEnv("PORT", "11451"),
		LogLevel:    getEnv("LOG_LEVEL", "info"),

		// 数据库配置
		DatabaseURL: getEnv("DATABASE_URL", "blog_platform.db"),

		// JWT 配置
		JWTSecret:      getEnv("JWT_SECRET", "JNU_technicians_club"),
		BcryptCost:     getEnvAsInt("BCRYPT_COST", 12),
		SessionTimeout: getEnv("SESSION_TIMEOUT", "24h"),
		RefreshTimeout: getEnv("REFRESH_TOKEN_TIMEOUT", "168h"),

		// 邮件配置
		EmailEnabled: getEnvAsBool("EMAIL_ENABLED", false),
		SMTPHost:     getEnv("SMTP_HOST", ""),
		SMTPPort:     getEnv("SMTP_PORT", "587"),
		SMTPUsername: getEnv("SMTP_USERNAME", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),

		// CORS 配置
		AllowedOrigins: getEnvAsSlice("ALLOWED_ORIGINS", "http://localhost:5173", ","),

		// 文件上传配置
		BasePath:         getEnv("BASE_PATH", "uploads"),
		MaxFileSize:      getEnvAsInt64("MAX_FILE_SIZE", 10485760), // 10MB
		AllowedFileTypes: getEnvAsSlice("ALLOWED_FILE_TYPES", ".md,.txt,.json", ","),

		// 限流配置
		RateLimitEnabled:  getEnvAsBool("RATE_LIMIT_ENABLED", true),
		RequestsPerMinute: getEnvAsInt("REQUESTS_PER_MINUTE", 100),
		RequestsPerHour:   getEnvAsInt("REQUESTS_PER_HOUR", 1000),

		// 缓存配置
		CacheEnabled: getEnvAsBool("CACHE_ENABLED", true),
		CacheTTL:     getEnv("CACHE_TTL", "900s"),
	}
}

// GetGinMode 获取 Gin 运行模式（映射到 Gin 支持的模式）
func (c *Config) GetGinMode() string {
	switch c.Environment {
	case "production":
		return "release"
	case "test":
		return "test"
	default: // development, debug 等都映射为 debug
		return "debug"
	}
}

// GetConfig 获取全局配置实例（单例模式）
func GetConfig() *Config {
	configOnce.Do(func() {
		configInstance = LoadConfig()
	})
	return configInstance
}

// IsProduction 检查是否为生产环境
func (c *Config) IsProduction() bool {
	return c.Environment == "production" || c.Environment == "release"
}

// IsDevelopment 检查是否为开发环境
func (c *Config) IsDevelopment() bool {
	return c.Environment == "development" || c.Environment == "debug"
}

// IsTest 检查是否为测试环境
func (c *Config) IsTest() bool {
	return c.Environment == "test"
}

// ShouldSkipEmailVerification 是否跳过邮箱验证
func (c *Config) ShouldSkipEmailVerification() bool {
	// 测试环境和开发环境跳过邮箱验证
	return c.IsTest() || c.IsDevelopment() || !c.EmailEnabled
}

// GetDatabaseConfig 获取数据库配置
func (c *Config) GetDatabaseConfig() map[string]interface{} {
	config := make(map[string]interface{})

	if c.IsTest() {
		// 测试环境使用内存数据库
		config["dsn"] = ":memory:"
		config["driver"] = "sqlite"
	} else {
		// 开发和生产环境使用文件数据库
		config["dsn"] = c.DatabaseURL
		config["driver"] = "sqlite"
	}

	return config
}

// GetLogConfig 获取日志配置
func (c *Config) GetLogConfig() map[string]interface{} {
	config := make(map[string]interface{})

	config["level"] = c.LogLevel
	config["format"] = "json"

	if c.IsDevelopment() {
		config["format"] = "console"
		config["level"] = "debug"
	}

	if c.IsTest() {
		config["level"] = "error" // 测试环境减少日志输出
	}

	return config
}

// GetCORSConfig 获取CORS配置
func (c *Config) GetCORSConfig() map[string]interface{} {
	config := make(map[string]interface{})

	config["allowed_origins"] = c.AllowedOrigins
	config["allowed_methods"] = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config["allowed_headers"] = []string{"Origin", "Content-Type", "Authorization"}
	config["allow_credentials"] = true

	if c.IsDevelopment() {
		// 开发环境允许所有来源
		config["allowed_origins"] = []string{"*"}
	}

	return config
}

// GetRateLimitConfig 获取限流配置
func (c *Config) GetRateLimitConfig() map[string]interface{} {
	config := make(map[string]interface{})

	if c.IsTest() {
		// 测试环境禁用限流
		config["enabled"] = false
	} else if c.IsDevelopment() {
		// 开发环境宽松限流
		config["enabled"] = true
		config["requests_per_minute"] = 1000
		config["requests_per_hour"] = 10000
	} else {
		// 生产环境严格限流
		config["enabled"] = true
		config["requests_per_minute"] = 60
		config["requests_per_hour"] = 1000
	}

	return config
}

// 辅助函数
func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value, exists := os.LookupEnv(key); exists {
		return strings.ToLower(value) == "true"
	}
	return defaultValue
}

func getEnvAsSlice(key, defaultValue, sep string) []string {
	if value, exists := os.LookupEnv(key); exists {
		return strings.Split(value, sep)
	}
	return strings.Split(defaultValue, sep)
}

func getEnvAsInt(key string, defaultValue int) int {
	if value, exists := os.LookupEnv(key); exists {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsInt64(key string, defaultValue int64) int64 {
	if value, exists := os.LookupEnv(key); exists {
		if intValue, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intValue
		}
	}
	return defaultValue
}
