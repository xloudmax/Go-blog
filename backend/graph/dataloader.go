package graph

import (
	"context"
	"fmt"
	"repair-platform/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/graph-gophers/dataloader/v7"
	"gorm.io/gorm"
)

// 定义 Loader Key 类型，必须实现 String() 方法 (虽然 v7 使用泛型，但某些接口可能仍需)
// v7 中 Key 是泛型 K comparable

// DataLoader 包含所有的 Loaders
type DataLoader struct {
	UserLoader  *dataloader.Loader[uint, *models.User]
	StatsLoader *dataloader.Loader[uint, *models.BlogPostStats]
}

// NewDataLoader 创建新的数据加载器实例
func NewDataLoader(db *gorm.DB) *DataLoader {
	// 用户加载器
	batchUsers := func(ctx context.Context, keys []uint) []*dataloader.Result[*models.User] {
		var results []*dataloader.Result[*models.User] = make([]*dataloader.Result[*models.User], len(keys))

		// 初始化结果并将所有结果默认为 nil/error
		for i := range results {
			results[i] = &dataloader.Result[*models.User]{Data: nil, Error: nil}
		}

		// 执行批量查询
		var users []models.User
		if err := db.Where("id IN ?", keys).Find(&users).Error; err != nil {
			// 如果查询失败，所有结果都设为错误
			for i := range results {
				results[i].Error = err
			}
			return results
		}

		// 将查询结果映射回 keys 的顺序
		userMap := make(map[uint]*models.User)
		for i := range users {
			userMap[users[i].ID] = &users[i]
		}

		for i, key := range keys {
			if user, ok := userMap[key]; ok {
				results[i].Data = user
			} else {
				// 没找到用户，不报错，返回 nil 或者根据业务需求处理
				// 这里保持 nil
				results[i].Error = fmt.Errorf("user not found: %d", key)
			}
		}

		return results
	}

	// 统计加载器
	batchStats := func(ctx context.Context, keys []uint) []*dataloader.Result[*models.BlogPostStats] {
		var results []*dataloader.Result[*models.BlogPostStats] = make([]*dataloader.Result[*models.BlogPostStats], len(keys))

		// 执行批量查询
		var stats []models.BlogPostStats
		if err := db.Where("blog_post_id IN ?", keys).Find(&stats).Error; err != nil {
			for i := range results {
				results[i] = &dataloader.Result[*models.BlogPostStats]{Error: err}
			}
			return results
		}

		// 映射结果
		statsMap := make(map[uint]*models.BlogPostStats)
		for i := range stats {
			statsMap[stats[i].BlogPostID] = &stats[i]
		}

		for i, key := range keys {
			if stat, ok := statsMap[key]; ok {
				results[i] = &dataloader.Result[*models.BlogPostStats]{Data: stat}
			} else {
				// 未找到统计数据，返回默认空统计
				defaultStats := &models.BlogPostStats{
					BlogPostID: key,
					ViewCount:  0,
					LikeCount:  0,
					// ID 必须设置，否则前端可能会报错
					ID: 0, // 或者是临时ID
				}
				results[i] = &dataloader.Result[*models.BlogPostStats]{Data: defaultStats}
			}
		}

		return results
	}

	// 配置 Loader 选项
	// 设置 Wait 时间为 2ms，足以收集同一事件循环中的请求
	userLoader := dataloader.NewBatchedLoader(batchUsers, dataloader.WithWait[uint, *models.User](2*time.Millisecond))
	statsLoader := dataloader.NewBatchedLoader(batchStats, dataloader.WithWait[uint, *models.BlogPostStats](2*time.Millisecond))

	return &DataLoader{
		UserLoader:  userLoader,
		StatsLoader: statsLoader,
	}
}

// LoadAuthor 加载作者
func (dl *DataLoader) LoadAuthor(ctx context.Context, userID uint) (*models.User, error) {
	thunk := dl.UserLoader.Load(ctx, userID)
	result, err := thunk()
	if err != nil {
		return nil, err
	}
	return result, nil
}

// LoadStats 加载统计
func (dl *DataLoader) LoadStats(ctx context.Context, postID uint) (*models.BlogPostStats, error) {
	thunk := dl.StatsLoader.Load(ctx, postID)
	result, err := thunk()
	if err != nil {
		return nil, err
	}
	return result, nil
}

// Loaders 接口 (兼容旧代码如需)
// 下面的方法是为了保持与旧接口的某种兼容性，或者方便其他地方调用
// 但实际上 schema.resolvers.go 已经修改为调用 LoadAuthor/LoadStats，所以接口签名是最重要的

// 辅助方法：GetDataLoaderFromContext
func GetDataLoaderFromContext(ctx context.Context) *DataLoader {
	if dl, ok := ctx.Value("dataloader").(*DataLoader); ok {
		return dl
	}
	return nil
}

// DataLoaderMiddleware Gin中间件
func DataLoaderMiddleware(db *gorm.DB) func(c *gin.Context) {
	return func(c *gin.Context) {
		loader := NewDataLoader(db)
		ctx := context.WithValue(c.Request.Context(), "dataloader", loader)
		c.Request = c.Request.WithContext(ctx)
		c.Next()
	}
}
