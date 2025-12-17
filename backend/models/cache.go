package models

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"sync"
	"time"
)

// MemoryCache 内存缓存结构体
type MemoryCache struct {
	data        map[string]*CacheItem
	mutex       sync.RWMutex
	janitor     *janitor
	maxSize     int64    // 最大缓存大小（字节）
	currentSize int64    // 当前缓存大小
	lru         *LRUList // LRU链表
}

// LRUList LRU链表实现
type LRUList struct {
	head *LRUNode
	tail *LRUNode
	size int
}

// LRUNode LRU节点
type LRUNode struct {
	key  string
	next *LRUNode
	prev *LRUNode
}

// CacheItem 缓存项结构体
type CacheItem struct {
	Value      interface{}
	Expiration int64
}

// janitor 清理器结构体
type janitor struct {
	interval time.Duration
	stop     chan bool
}

// NewMemoryCache 创建新的内存缓存实例
func NewMemoryCache(cleanupInterval time.Duration) *MemoryCache {
	cache := &MemoryCache{
		data: make(map[string]*CacheItem),
	}

	// 启动清理器
	if cleanupInterval > 0 {
		cache.janitor = &janitor{
			interval: cleanupInterval,
			stop:     make(chan bool),
		}
		go cache.janitor.run(cache)
	}

	return cache
}

// Set 设置缓存项
func (c *MemoryCache) Set(key string, value interface{}, duration time.Duration) {
	var expiration int64
	if duration > 0 {
		expiration = time.Now().Add(duration).UnixNano()
	}

	c.mutex.Lock()
	c.data[key] = &CacheItem{
		Value:      value,
		Expiration: expiration,
	}
	c.mutex.Unlock()
}

// Get 获取缓存项
func (c *MemoryCache) Get(key string) (interface{}, bool) {
	c.mutex.RLock()
	item, found := c.data[key]
	if !found {
		c.mutex.RUnlock()
		return nil, false
	}

	if item.Expiration > 0 && time.Now().UnixNano() > item.Expiration {
		c.mutex.RUnlock()
		c.Delete(key)
		return nil, false
	}

	c.mutex.RUnlock()
	return item.Value, true
}

// Delete 删除缓存项
func (c *MemoryCache) Delete(key string) {
	c.mutex.Lock()
	delete(c.data, key)
	c.mutex.Unlock()
}

// Exists 检查缓存项是否存在
func (c *MemoryCache) Exists(key string) bool {
	_, found := c.Get(key)
	return found
}

// Clear 清空所有缓存
func (c *MemoryCache) Clear() {
	c.mutex.Lock()
	c.data = make(map[string]*CacheItem)
	c.mutex.Unlock()
}

// Count 获取缓存项数量
func (c *MemoryCache) Count() int {
	c.mutex.RLock()
	count := len(c.data)
	c.mutex.RUnlock()
	return count
}

// DeleteExpired 删除过期的缓存项
func (c *MemoryCache) DeleteExpired() {
	now := time.Now().UnixNano()
	c.mutex.Lock()
	for key, item := range c.data {
		if item.Expiration > 0 && now > item.Expiration {
			delete(c.data, key)
		}
	}
	c.mutex.Unlock()
}

// Stop 停止清理器
func (c *MemoryCache) Stop() {
	if c.janitor != nil {
		c.janitor.stop <- true
	}
}

// run 清理器运行逻辑
func (j *janitor) run(cache *MemoryCache) {
	ticker := time.NewTicker(j.interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			cache.DeleteExpired()
		case <-j.stop:
			return
		}
	}
}

// VerificationCode 验证码结构体
type VerificationCode struct {
	Code      string
	Email     string
	Type      string // REGISTER, LOGIN, RESET_PASSWORD
	ExpiresAt time.Time
	Used      bool
}

// EmailVerificationService 邮箱验证服务
type EmailVerificationService struct {
	cache *MemoryCache
}

// Stop 停止邮箱验证码缓存的清理器
func (evs *EmailVerificationService) Stop() {
	if evs != nil && evs.cache != nil {
		evs.cache.Stop()
	}
}

// Cache 暴露内部缓存（用于兼容旧路径）
func (evs *EmailVerificationService) Cache() *MemoryCache {
	return evs.cache
}

// NewEmailVerificationService 创建邮箱验证服务
func NewEmailVerificationService() *EmailVerificationService {
	return &EmailVerificationService{
		cache: NewMemoryCache(5 * time.Minute), // 每5分钟清理一次
	}
}

// GenerateVerificationCode 生成验证码
func (evs *EmailVerificationService) GenerateVerificationCode(email, codeType string) (string, error) {
	// 生成6位数字验证码
	code := ""
	for i := 0; i < 6; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", err
		}
		code += num.String()
	}

	// 缓存键格式：email:type
	key := fmt.Sprintf("%s:%s", email, codeType)

	verificationCode := &VerificationCode{
		Code:      code,
		Email:     email,
		Type:      codeType,
		ExpiresAt: time.Now().Add(15 * time.Minute), // 15分钟过期
		Used:      false,
	}

	// 存储到缓存中，15分钟过期
	evs.cache.Set(key, verificationCode, 15*time.Minute)

	return code, nil
}

// VerifyCode 验证验证码
func (evs *EmailVerificationService) VerifyCode(email, code, codeType string) bool {
	key := fmt.Sprintf("%s:%s", email, codeType)

	value, found := evs.cache.Get(key)
	if !found {
		return false
	}

	verificationCode, ok := value.(*VerificationCode)
	if !ok {
		return false
	}

	// 检查验证码是否正确、未使用且未过期
	if verificationCode.Code == code &&
		!verificationCode.Used &&
		time.Now().Before(verificationCode.ExpiresAt) {
		// 标记为已使用
		verificationCode.Used = true
		evs.cache.Set(key, verificationCode, time.Until(verificationCode.ExpiresAt))
		return true
	}

	return false
}

// InvalidateCode 使验证码失效
func (evs *EmailVerificationService) InvalidateCode(email, codeType string) {
	key := fmt.Sprintf("%s:%s", email, codeType)
	evs.cache.Delete(key)
}

// HasPendingCode 检查是否有待验证的验证码
func (evs *EmailVerificationService) HasPendingCode(email, codeType string) bool {
	key := fmt.Sprintf("%s:%s", email, codeType)

	value, found := evs.cache.Get(key)
	if !found {
		return false
	}

	verificationCode, ok := value.(*VerificationCode)
	if !ok {
		return false
	}

	return !verificationCode.Used && time.Now().Before(verificationCode.ExpiresAt)
}

// 全局缓存实例
var (
	GlobalCache          *MemoryCache
	EmailVerificationSvc *EmailVerificationService
	once                 sync.Once
)

// InitCache 初始化缓存
func InitCache() {
	once.Do(func() {
		GlobalCache = NewMemoryCache(10 * time.Minute)
		EmailVerificationSvc = NewEmailVerificationService()
	})
}

// GetCache 获取全局缓存实例
func GetCache() *MemoryCache {
	if GlobalCache == nil {
		InitCache()
	}
	return GlobalCache
}

// GetEmailVerificationService 获取邮箱验证服务实例
func GetEmailVerificationService() *EmailVerificationService {
	if EmailVerificationSvc == nil {
		InitCache()
	}
	return EmailVerificationSvc
}
