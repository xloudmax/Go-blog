package services

import (
	"math"
	"repair-platform/models"
	"sort"
	"strings"
	"time"

	"gorm.io/gorm"
)

// SearchService 搜索服务
type SearchService struct {
	db *gorm.DB
}

// NewSearchService 创建搜索服务实例
func NewSearchService(db *gorm.DB) *SearchService {
	return &SearchService{db: db}
}

// SearchResult 搜索结果
type SearchResult struct {
	Posts []*models.BlogPost
	Total int64
	Took  time.Duration
}

// AdvancedSearchPosts 高级搜索博客文章（带缓存）
func (s *SearchService) AdvancedSearchPosts(query string, limit, offset int, userID *uint, userRole string) (*SearchResult, error) {
	startTime := time.Now()

	// 尝试从缓存获取结果
	cacheService := GetGlobalSearchCache()
	if cached, found := cacheService.Get(query, limit, offset, userID, userRole); found {
		// 返回缓存结果，更新耗时为缓存查询时间
		return &SearchResult{
			Posts: cached.Posts,
			Total: cached.Total,
			Took:  time.Since(startTime), // 缓存查询耗时
		}, nil
	}

	// 分词处理
	keywords := s.tokenize(query)
	if len(keywords) == 0 {
		return &SearchResult{Posts: []*models.BlogPost{}, Total: 0}, nil
	}

	// 构建搜索查询
	dbQuery := s.db.Model(&models.BlogPost{}).
		Preload("Author").
		Preload("Stats")

	// 权限过滤
	if userRole != "admin" {
		if userID != nil {
			dbQuery = dbQuery.Where("(status = 'PUBLISHED' AND access_level = 'PUBLIC') OR author_id = ?", *userID)
		} else {
			dbQuery = dbQuery.Where("status = 'PUBLISHED' AND access_level = 'PUBLIC'")
		}
	}

	// 多字段搜索
	var searchConditions []string
	var searchArgs []interface{}

	for _, keyword := range keywords {
		likeKeyword := "%" + keyword + "%"
		searchConditions = append(searchConditions, "(title LIKE ? OR content LIKE ? OR tags LIKE ? OR categories LIKE ?)")
		searchArgs = append(searchArgs, likeKeyword, likeKeyword, likeKeyword, likeKeyword)
	}

	if len(searchConditions) > 0 {
		dbQuery = dbQuery.Where(strings.Join(searchConditions, " AND "), searchArgs...)
	}

	// 获取总数
	var total int64
	countQuery := dbQuery
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, err
	}

	// 获取结果
	var posts []models.BlogPost
	err := dbQuery.
		Offset(offset).
		Limit(limit).
		Order("created_at DESC"). // 基础排序，后续会用相关性重排
		Find(&posts).Error

	if err != nil {
		return nil, err
	}

	// 计算相关性得分并重新排序
	scoredPosts := s.calculateRelevanceScores(posts, keywords)

	// 转换为指针数组
	result := make([]*models.BlogPost, len(scoredPosts))
	for i := range scoredPosts {
		result[i] = &scoredPosts[i].Post
	}

	took := time.Since(startTime)

	searchResult := &SearchResult{
		Posts: result,
		Total: total,
		Took:  took,
	}

	// 缓存搜索结果（5分钟TTL）
	cacheService.Set(query, limit, offset, userID, userRole, searchResult, 5*time.Minute)

	return searchResult, nil
}

// ScoredPost 带得分的文章
type ScoredPost struct {
	Post  models.BlogPost
	Score float64
}

// calculateRelevanceScores 计算相关性得分
func (s *SearchService) calculateRelevanceScores(posts []models.BlogPost, keywords []string) []ScoredPost {
	var scoredPosts []ScoredPost

	for _, post := range posts {
		score := s.calculatePostScore(post, keywords)
		scoredPosts = append(scoredPosts, ScoredPost{
			Post:  post,
			Score: score,
		})
	}

	// 按得分降序排序
	sort.Slice(scoredPosts, func(i, j int) bool {
		return scoredPosts[i].Score > scoredPosts[j].Score
	})

	return scoredPosts
}

// calculatePostScore 计算单篇文章的相关性得分
func (s *SearchService) calculatePostScore(post models.BlogPost, keywords []string) float64 {
	var totalScore float64

	// 字段权重
	titleWeight := 3.0
	contentWeight := 1.0
	tagsWeight := 2.0
	categoriesWeight := 1.5

	// 时间衰减因子（新文章得分更高）
	timeFactor := s.calculateTimeFactor(post.CreatedAt)

	// 人气因子（基于浏览量和点赞数）
	popularityFactor := s.calculatePopularityFactor(post)

	for _, keyword := range keywords {
		lowerKeyword := strings.ToLower(keyword)

		// 标题匹配
		titleScore := s.calculateFieldScore(strings.ToLower(post.Title), lowerKeyword) * titleWeight

		// 内容匹配
		contentScore := s.calculateFieldScore(strings.ToLower(post.Content), lowerKeyword) * contentWeight

		// 标签匹配
		tagsScore := s.calculateFieldScore(strings.ToLower(post.Tags), lowerKeyword) * tagsWeight

		// 分类匹配
		categoriesScore := s.calculateFieldScore(strings.ToLower(post.Categories), lowerKeyword) * categoriesWeight

		totalScore += titleScore + contentScore + tagsScore + categoriesScore
	}

	// 应用时间和人气因子
	finalScore := totalScore * timeFactor * popularityFactor

	return finalScore
}

// calculateFieldScore 计算字段匹配得分
func (s *SearchService) calculateFieldScore(fieldValue, keyword string) float64 {
	if !strings.Contains(fieldValue, keyword) {
		return 0
	}

	// 精确匹配得分更高
	if fieldValue == keyword {
		return 10.0
	}

	// 计算匹配次数
	matchCount := strings.Count(fieldValue, keyword)

	// 计算字段长度因子（在较短的字段中匹配得分更高）
	lengthFactor := 1.0 / (1.0 + math.Log(float64(len(fieldValue))/float64(len(keyword))))

	return float64(matchCount) * lengthFactor
}

// calculateTimeFactor 计算时间衰减因子
func (s *SearchService) calculateTimeFactor(createdAt time.Time) float64 {
	daysSinceCreated := time.Since(createdAt).Hours() / 24

	// 30天内的文章得分不衰减，之后每30天衰减10%
	if daysSinceCreated <= 30 {
		return 1.0
	}

	decayPeriods := (daysSinceCreated - 30) / 30
	timeFactor := math.Pow(0.9, decayPeriods)

	// 最小时间因子为0.1
	if timeFactor < 0.1 {
		timeFactor = 0.1
	}

	return timeFactor
}

// calculatePopularityFactor 计算人气因子
func (s *SearchService) calculatePopularityFactor(post models.BlogPost) float64 {
	// 基础人气得分
	popularityScore := float64(post.ViewCount)*0.1 + float64(post.Likes)*2.0

	// 使用对数函数避免热门文章得分过高
	if popularityScore > 0 {
		return 1.0 + math.Log(1.0+popularityScore)/10.0
	}

	return 1.0
}

// tokenize 分词处理
func (s *SearchService) tokenize(query string) []string {
	// 简单的分词实现，可以后续集成更高级的分词器
	query = strings.TrimSpace(query)
	if query == "" {
		return []string{}
	}

	// 按空格分割
	words := strings.Fields(query)

	// 去重和清理
	keywordMap := make(map[string]bool)
	var keywords []string

	for _, word := range words {
		word = strings.ToLower(strings.TrimSpace(word))
		if len(word) >= 2 && !keywordMap[word] { // 忽略长度小于2的词
			keywordMap[word] = true
			keywords = append(keywords, word)
		}
	}

	return keywords
}

// GetSearchSuggestions 获取搜索建议
func (s *SearchService) GetSearchSuggestions(query string, limit int) ([]string, error) {
	keywords := s.tokenize(query)
	if len(keywords) == 0 {
		return []string{}, nil
	}

	// 从文章标题和标签中获取建议
	var suggestions []string

	// 标题建议
	var titles []string
	err := s.db.Model(&models.BlogPost{}).
		Where("status = 'PUBLISHED' AND access_level = 'PUBLIC'").
		Where("title LIKE ?", "%"+strings.Join(keywords, "%")+"%").
		Limit(limit/2).
		Pluck("title", &titles).Error

	if err == nil {
		suggestions = append(suggestions, titles...)
	}

	// 标签建议
	var tags []string
	err = s.db.Model(&models.BlogPost{}).
		Where("status = 'PUBLISHED' AND access_level = 'PUBLIC'").
		Where("tags LIKE ?", "%"+strings.Join(keywords, "%")+"%").
		Limit(limit/2).
		Pluck("tags", &tags).Error

	if err == nil {
		// 解析标签字符串
		for _, tagString := range tags {
			if tagString != "" {
				tagList := strings.Split(tagString, ",")
				for _, tag := range tagList {
					tag = strings.TrimSpace(tag)
					if tag != "" && !contains(suggestions, tag) {
						suggestions = append(suggestions, tag)
					}
				}
			}
		}
	}

	// 限制返回数量
	if len(suggestions) > limit {
		suggestions = suggestions[:limit]
	}

	return suggestions, nil
}

// contains 检查切片是否包含指定元素
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// GetTrendingSearches 获取热门搜索词
func (s *SearchService) GetTrendingSearches(limit int) ([]string, error) {
	// 简化实现：从文章标签中获取最常用的词
	var tags []string
	err := s.db.Model(&models.BlogPost{}).
		Where("status = 'PUBLISHED' AND access_level = 'PUBLIC'").
		Where("created_at > ?", time.Now().AddDate(0, -1, 0)). // 最近一个月
		Pluck("tags", &tags).Error

	if err != nil {
		return []string{}, err
	}

	// 统计标签频率
	tagCount := make(map[string]int)
	for _, tagString := range tags {
		if tagString != "" {
			tagList := strings.Split(tagString, ",")
			for _, tag := range tagList {
				tag = strings.TrimSpace(tag)
				if len(tag) >= 2 {
					tagCount[tag]++
				}
			}
		}
	}

	// 排序并返回前N个
	type tagFreq struct {
		tag   string
		count int
	}

	var tagFreqs []tagFreq
	for tag, count := range tagCount {
		tagFreqs = append(tagFreqs, tagFreq{tag: tag, count: count})
	}

	sort.Slice(tagFreqs, func(i, j int) bool {
		return tagFreqs[i].count > tagFreqs[j].count
	})

	var trending []string
	for i, tf := range tagFreqs {
		if i >= limit {
			break
		}
		trending = append(trending, tf.tag)
	}

	return trending, nil
}
