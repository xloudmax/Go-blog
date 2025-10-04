package services

import (
	"fmt"
	"repair-platform/models"
	"strings"

	"gorm.io/gorm"
)

// TagService 标签管理服务
type TagService struct {
	db *gorm.DB
}

// NewTagService 创建标签服务
func NewTagService(db *gorm.DB) *TagService {
	return &TagService{db: db}
}

// TagInfo 标签信息
type TagInfo struct {
	Name  string
	Count int
	Posts []*models.BlogPost
}

// CategoryInfo 分类信息
type CategoryInfo struct {
	Name  string
	Count int
	Posts []*models.BlogPost
}

// TagCategoryStats 标签分类统计
type TagCategoryStats struct {
	TotalTags       int
	TotalCategories int
	Tags            []*TagInfo
	Categories      []*CategoryInfo
}

// GetTags 获取所有标签及使用次数
func (s *TagService) GetTags(limit *int, offset *int, search *string) ([]*TagInfo, error) {
	var posts []models.BlogPost

	// 获取所有已发布的文章
	query := s.db.Where("status = ?", "PUBLISHED")

	if err := query.Find(&posts).Error; err != nil {
		return nil, fmt.Errorf("failed to get posts: %w", err)
	}

	// 统计标签使用次数
	tagMap := make(map[string]*TagInfo)

	for _, post := range posts {
		tags := post.GetTagsArray()
		for _, tagName := range tags {
			tagName = strings.TrimSpace(tagName)
			if tagName == "" {
				continue
			}

			// 如果有搜索条件，过滤标签
			if search != nil && *search != "" && !strings.Contains(strings.ToLower(tagName), strings.ToLower(*search)) {
				continue
			}

			if _, exists := tagMap[tagName]; !exists {
				tagMap[tagName] = &TagInfo{
					Name:  tagName,
					Count: 0,
					Posts: []*models.BlogPost{},
				}
			}
			tagMap[tagName].Count++
			tagMap[tagName].Posts = append(tagMap[tagName].Posts, &post)
		}
	}

	// 转换为切片并排序
	tags := make([]*TagInfo, 0, len(tagMap))
	for _, tagInfo := range tagMap {
		tags = append(tags, tagInfo)
	}

	// 按使用次数降序排序
	for i := 0; i < len(tags)-1; i++ {
		for j := i + 1; j < len(tags); j++ {
			if tags[i].Count < tags[j].Count {
				tags[i], tags[j] = tags[j], tags[i]
			}
		}
	}

	// 应用分页
	start := 0
	end := len(tags)

	if offset != nil && *offset < len(tags) {
		start = *offset
	}

	if limit != nil && start+*limit < len(tags) {
		end = start + *limit
	}

	if start >= len(tags) {
		return []*TagInfo{}, nil
	}

	return tags[start:end], nil
}

// GetCategories 获取所有分类及使用次数
func (s *TagService) GetCategories(limit *int, offset *int, search *string) ([]*CategoryInfo, error) {
	var posts []models.BlogPost

	// 获取所有已发布的文章
	query := s.db.Where("status = ?", "PUBLISHED")

	if err := query.Find(&posts).Error; err != nil {
		return nil, fmt.Errorf("failed to get posts: %w", err)
	}

	// 统计分类使用次数
	categoryMap := make(map[string]*CategoryInfo)

	for _, post := range posts {
		categories := post.GetCategoriesArray()
		for _, categoryName := range categories {
			categoryName = strings.TrimSpace(categoryName)
			if categoryName == "" {
				continue
			}

			// 如果有搜索条件，过滤分类
			if search != nil && *search != "" && !strings.Contains(strings.ToLower(categoryName), strings.ToLower(*search)) {
				continue
			}

			if _, exists := categoryMap[categoryName]; !exists {
				categoryMap[categoryName] = &CategoryInfo{
					Name:  categoryName,
					Count: 0,
					Posts: []*models.BlogPost{},
				}
			}
			categoryMap[categoryName].Count++
			categoryMap[categoryName].Posts = append(categoryMap[categoryName].Posts, &post)
		}
	}

	// 转换为切片并排序
	categories := make([]*CategoryInfo, 0, len(categoryMap))
	for _, categoryInfo := range categoryMap {
		categories = append(categories, categoryInfo)
	}

	// 按使用次数降序排序
	for i := 0; i < len(categories)-1; i++ {
		for j := i + 1; j < len(categories); j++ {
			if categories[i].Count < categories[j].Count {
				categories[i], categories[j] = categories[j], categories[i]
			}
		}
	}

	// 应用分页
	start := 0
	end := len(categories)

	if offset != nil && *offset < len(categories) {
		start = *offset
	}

	if limit != nil && start+*limit < len(categories) {
		end = start + *limit
	}

	if start >= len(categories) {
		return []*CategoryInfo{}, nil
	}

	return categories[start:end], nil
}

// GetTagCategoryStats 获取标签和分类的统计信息
func (s *TagService) GetTagCategoryStats() (*TagCategoryStats, error) {
	tags, err := s.GetTags(nil, nil, nil)
	if err != nil {
		return nil, err
	}

	categories, err := s.GetCategories(nil, nil, nil)
	if err != nil {
		return nil, err
	}

	return &TagCategoryStats{
		TotalTags:       len(tags),
		TotalCategories: len(categories),
		Tags:            tags,
		Categories:      categories,
	}, nil
}

// MergeTags 合并标签（将sourceTag的所有文章移动到targetTag）
func (s *TagService) MergeTags(sourceTag, targetTag string) error {
	sourceTag = strings.TrimSpace(sourceTag)
	targetTag = strings.TrimSpace(targetTag)

	if sourceTag == "" || targetTag == "" {
		return fmt.Errorf("source and target tags cannot be empty")
	}

	if sourceTag == targetTag {
		return fmt.Errorf("source and target tags cannot be the same")
	}

	// 查找所有包含sourceTag的文章
	var posts []models.BlogPost
	if err := s.db.Find(&posts).Error; err != nil {
		return fmt.Errorf("failed to get posts: %w", err)
	}

	// 开始事务
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, post := range posts {
		tags := post.GetTagsArray()
		hasSource := false
		hasTarget := false
		newTags := []string{}

		// 检查文章是否包含这些标签
		for _, tag := range tags {
			tag = strings.TrimSpace(tag)
			if tag == sourceTag {
				hasSource = true
			}
			if tag == targetTag {
				hasTarget = true
			}
		}

		// 如果文章包含sourceTag
		if hasSource {
			for _, tag := range tags {
				tag = strings.TrimSpace(tag)
				// 跳过sourceTag
				if tag == sourceTag {
					// 如果还没有targetTag，添加它
					if !hasTarget {
						newTags = append(newTags, targetTag)
						hasTarget = true
					}
				} else {
					newTags = append(newTags, tag)
				}
			}

			// 更新文章标签
			post.SetTagsFromArray(newTags)
			if err := tx.Save(&post).Error; err != nil {
				tx.Rollback()
				return fmt.Errorf("failed to update post %d: %w", post.ID, err)
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// MergeCategories 合并分类
func (s *TagService) MergeCategories(sourceCategory, targetCategory string) error {
	sourceCategory = strings.TrimSpace(sourceCategory)
	targetCategory = strings.TrimSpace(targetCategory)

	if sourceCategory == "" || targetCategory == "" {
		return fmt.Errorf("source and target categories cannot be empty")
	}

	if sourceCategory == targetCategory {
		return fmt.Errorf("source and target categories cannot be the same")
	}

	// 查找所有包含sourceCategory的文章
	var posts []models.BlogPost
	if err := s.db.Find(&posts).Error; err != nil {
		return fmt.Errorf("failed to get posts: %w", err)
	}

	// 开始事务
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, post := range posts {
		categories := post.GetCategoriesArray()
		hasSource := false
		hasTarget := false
		newCategories := []string{}

		// 检查文章是否包含这些分类
		for _, category := range categories {
			category = strings.TrimSpace(category)
			if category == sourceCategory {
				hasSource = true
			}
			if category == targetCategory {
				hasTarget = true
			}
		}

		// 如果文章包含sourceCategory
		if hasSource {
			for _, category := range categories {
				category = strings.TrimSpace(category)
				// 跳过sourceCategory
				if category == sourceCategory {
					// 如果还没有targetCategory，添加它
					if !hasTarget {
						newCategories = append(newCategories, targetCategory)
						hasTarget = true
					}
				} else {
					newCategories = append(newCategories, category)
				}
			}

			// 更新文章分类
			post.SetCategoriesFromArray(newCategories)
			if err := tx.Save(&post).Error; err != nil {
				tx.Rollback()
				return fmt.Errorf("failed to update post %d: %w", post.ID, err)
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// BatchUpdateTags 批量更新文章标签
func (s *TagService) BatchUpdateTags(postIDs []uint, tags []string, operation string) error {
	if len(postIDs) == 0 {
		return fmt.Errorf("post IDs cannot be empty")
	}

	// 清理标签
	cleanTags := []string{}
	for _, tag := range tags {
		tag = strings.TrimSpace(tag)
		if tag != "" {
			cleanTags = append(cleanTags, tag)
		}
	}

	// 开始事务
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, postID := range postIDs {
		var post models.BlogPost
		if err := tx.First(&post, postID).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to get post %d: %w", postID, err)
		}

		if operation == "REPLACE" {
			// 替换所有标签
			post.SetTagsFromArray(cleanTags)
		} else if operation == "ADD" {
			// 添加新标签（避免重复）
			existingTags := make(map[string]bool)
			currentTags := post.GetTagsArray()

			for _, tag := range currentTags {
				existingTags[strings.TrimSpace(tag)] = true
			}

			newTags := currentTags
			for _, tag := range cleanTags {
				if !existingTags[tag] {
					newTags = append(newTags, tag)
				}
			}
			post.SetTagsFromArray(newTags)
		} else {
			tx.Rollback()
			return fmt.Errorf("invalid operation: %s", operation)
		}

		if err := tx.Save(&post).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to update post %d: %w", postID, err)
		}
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// BatchUpdateCategories 批量更新文章分类
func (s *TagService) BatchUpdateCategories(postIDs []uint, categories []string, operation string) error {
	if len(postIDs) == 0 {
		return fmt.Errorf("post IDs cannot be empty")
	}

	// 清理分类
	cleanCategories := []string{}
	for _, category := range categories {
		category = strings.TrimSpace(category)
		if category != "" {
			cleanCategories = append(cleanCategories, category)
		}
	}

	// 开始事务
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, postID := range postIDs {
		var post models.BlogPost
		if err := tx.First(&post, postID).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to get post %d: %w", postID, err)
		}

		if operation == "REPLACE" {
			// 替换所有分类
			post.SetCategoriesFromArray(cleanCategories)
		} else if operation == "ADD" {
			// 添加新分类（避免重复）
			existingCategories := make(map[string]bool)
			currentCategories := post.GetCategoriesArray()

			for _, category := range currentCategories {
				existingCategories[strings.TrimSpace(category)] = true
			}

			newCategories := currentCategories
			for _, category := range cleanCategories {
				if !existingCategories[category] {
					newCategories = append(newCategories, category)
				}
			}
			post.SetCategoriesFromArray(newCategories)
		} else {
			tx.Rollback()
			return fmt.Errorf("invalid operation: %s", operation)
		}

		if err := tx.Save(&post).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to update post %d: %w", postID, err)
		}
	}

	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// DeleteUnusedTags 删除未使用的标签（实际上是清理空标签）
func (s *TagService) DeleteUnusedTags() (int, error) {
	var posts []models.BlogPost
	if err := s.db.Find(&posts).Error; err != nil {
		return 0, fmt.Errorf("failed to get posts: %w", err)
	}

	cleaned := 0
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, post := range posts {
		tags := post.GetTagsArray()
		originalLen := len(tags)
		cleanTags := []string{}

		for _, tag := range tags {
			tag = strings.TrimSpace(tag)
			if tag != "" {
				cleanTags = append(cleanTags, tag)
			}
		}

		if len(cleanTags) != originalLen {
			post.SetTagsFromArray(cleanTags)
			if err := tx.Save(&post).Error; err != nil {
				tx.Rollback()
				return 0, fmt.Errorf("failed to update post %d: %w", post.ID, err)
			}
			cleaned++
		}
	}

	if err := tx.Commit().Error; err != nil {
		return 0, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return cleaned, nil
}

// DeleteUnusedCategories 删除未使用的分类
func (s *TagService) DeleteUnusedCategories() (int, error) {
	var posts []models.BlogPost
	if err := s.db.Find(&posts).Error; err != nil {
		return 0, fmt.Errorf("failed to get posts: %w", err)
	}

	cleaned := 0
	tx := s.db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, post := range posts {
		categories := post.GetCategoriesArray()
		originalLen := len(categories)
		cleanCategories := []string{}

		for _, category := range categories {
			category = strings.TrimSpace(category)
			if category != "" {
				cleanCategories = append(cleanCategories, category)
			}
		}

		if len(cleanCategories) != originalLen {
			post.SetCategoriesFromArray(cleanCategories)
			if err := tx.Save(&post).Error; err != nil {
				tx.Rollback()
				return 0, fmt.Errorf("failed to update post %d: %w", post.ID, err)
			}
			cleaned++
		}
	}

	if err := tx.Commit().Error; err != nil {
		return 0, fmt.Errorf("failed to commit transaction: %w", err)
	}

	return cleaned, nil
}
