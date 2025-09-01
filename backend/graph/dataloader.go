package graph

import (
	"context"
	"repair-platform/models"
	"sync"
	"time"

	"gorm.io/gorm"
)

// DataLoader 批量加载器的简化实现
type DataLoader struct {
	db            *gorm.DB
	authorCache   map[uint]*models.User
	statsCache    map[uint]*models.BlogPostStats
	mutex         sync.RWMutex
	lastClearTime time.Time
}

// NewDataLoader 创建新的数据加载器
func NewDataLoader(db *gorm.DB) *DataLoader {
	return &DataLoader{
		db:            db,
		authorCache:   make(map[uint]*models.User),
		statsCache:    make(map[uint]*models.BlogPostStats),
		lastClearTime: time.Now(),
	}
}

// LoadAuthor 加载作者信息
func (dl *DataLoader) LoadAuthor(ctx context.Context, userID uint) (*models.User, error) {
	dl.mutex.RLock()
	if user, exists := dl.authorCache[userID]; exists {
		dl.mutex.RUnlock()
		return user, nil
	}
	dl.mutex.RUnlock()

	// 不在缓存中，从数据库加载
	var user models.User
	err := dl.db.First(&user, userID).Error
	if err != nil {
		return nil, err
	}

	// 保存到缓存
	dl.mutex.Lock()
	dl.authorCache[userID] = &user
	dl.mutex.Unlock()

	return &user, nil
}

// LoadStats 加载统计信息
func (dl *DataLoader) LoadStats(ctx context.Context, postID uint) (*models.BlogPostStats, error) {
	dl.mutex.RLock()
	if stats, exists := dl.statsCache[postID]; exists {
		dl.mutex.RUnlock()
		return stats, nil
	}
	dl.mutex.RUnlock()

	// 不在缓存中，从数据库加载
	var stats models.BlogPostStats
	err := dl.db.Where("blog_post_id = ?", postID).First(&stats).Error
	if err != nil {
		// 如果没有统计记录，创建一个默认的
		stats = models.BlogPostStats{
			BlogPostID: postID,
			ViewCount:  0,
			LikeCount:  0,
		}
	}

	// 保存到缓存
	dl.mutex.Lock()
	dl.statsCache[postID] = &stats
	dl.mutex.Unlock()

	return &stats, nil
}

// BatchLoadAuthors 批量加载作者信息
func (dl *DataLoader) BatchLoadAuthors(ctx context.Context, userIDs []uint) (map[uint]*models.User, error) {
	// 检查哪些用户不在缓存中
	dl.mutex.RLock()
	var missingIDs []uint
	result := make(map[uint]*models.User)

	for _, userID := range userIDs {
		if user, exists := dl.authorCache[userID]; exists {
			result[userID] = user
		} else {
			missingIDs = append(missingIDs, userID)
		}
	}
	dl.mutex.RUnlock()

	// 批量加载缺失的用户
	if len(missingIDs) > 0 {
		var users []models.User
		err := dl.db.Where("id IN ?", missingIDs).Find(&users).Error
		if err != nil {
			return nil, err
		}

		// 更新缓存和结果
		dl.mutex.Lock()
		for i := range users {
			dl.authorCache[users[i].ID] = &users[i]
			result[users[i].ID] = &users[i]
		}
		dl.mutex.Unlock()
	}

	return result, nil
}

// BatchLoadStats 批量加载统计信息
func (dl *DataLoader) BatchLoadStats(ctx context.Context, postIDs []uint) (map[uint]*models.BlogPostStats, error) {
	// 检查哪些统计不在缓存中
	dl.mutex.RLock()
	var missingIDs []uint
	result := make(map[uint]*models.BlogPostStats)

	for _, postID := range postIDs {
		if stats, exists := dl.statsCache[postID]; exists {
			result[postID] = stats
		} else {
			missingIDs = append(missingIDs, postID)
		}
	}
	dl.mutex.RUnlock()

	// 批量加载缺失的统计
	if len(missingIDs) > 0 {
		var stats []models.BlogPostStats
		err := dl.db.Where("blog_post_id IN ?", missingIDs).Find(&stats).Error
		if err != nil {
			return nil, err
		}

		statsMap := make(map[uint]*models.BlogPostStats)
		for i := range stats {
			statsMap[stats[i].BlogPostID] = &stats[i]
		}

		// 更新缓存和结果
		dl.mutex.Lock()
		for _, postID := range missingIDs {
			if stat, exists := statsMap[postID]; exists {
				dl.statsCache[postID] = stat
				result[postID] = stat
			} else {
				// 创建默认统计
				defaultStats := &models.BlogPostStats{
					BlogPostID: postID,
					ViewCount:  0,
					LikeCount:  0,
				}
				dl.statsCache[postID] = defaultStats
				result[postID] = defaultStats
			}
		}
		dl.mutex.Unlock()
	}

	return result, nil
}

// ClearCache 清理缓存
func (dl *DataLoader) ClearCache() {
	dl.mutex.Lock()
	dl.authorCache = make(map[uint]*models.User)
	dl.statsCache = make(map[uint]*models.BlogPostStats)
	dl.lastClearTime = time.Now()
	dl.mutex.Unlock()
}

// GetDataLoaderFromContext 从上下文获取DataLoader
func GetDataLoaderFromContext(ctx context.Context) *DataLoader {
	if dl, ok := ctx.Value("dataloader").(*DataLoader); ok {
		return dl
	}
	return nil
}
