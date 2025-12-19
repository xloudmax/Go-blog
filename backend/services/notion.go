package services

import (
	"context"
	"fmt"
	"os"
	"repair-platform/models"
	"strings"
	"time"

	"github.com/jomei/notionapi"
	"gorm.io/gorm"
)

type NotionService struct {
	client *notionapi.Client
	db     *gorm.DB
}

func NewNotionService(db *gorm.DB) *NotionService {
	apiKey := os.Getenv("NOTION_API_KEY")
	if apiKey == "" {
		return nil
	}
	client := notionapi.NewClient(notionapi.Token(apiKey))
	return &NotionService{
		client: client,
		db:     db,
	}
}

// SyncPosts 同步所有文章
func (s *NotionService) SyncPosts(ctx context.Context, adminUser *models.User) error {
	if s == nil {
		return fmt.Errorf("Notion API Key not configured")
	}

	// 1. 搜索所有 Page
	req := &notionapi.SearchRequest{
		Filter: notionapi.SearchFilter{
			Property: "object",
			Value:    "page",
		},
		Sort: &notionapi.SortObject{
			Direction: notionapi.SortOrderDESC,
			Timestamp: notionapi.TimestampLastEdited,
		},
	}

	res, err := s.client.Search.Do(ctx, req)
	if err != nil {
		return fmt.Errorf("search failed: %w", err)
	}

	for _, result := range res.Results {
		if page, ok := result.(*notionapi.Page); ok {
			if err := s.processPage(ctx, page, adminUser); err != nil {
				fmt.Printf("Error processing page %s: %v\n", page.ID, err)
				continue
			}
		}
	}

	return nil
}

func (s *NotionService) processPage(ctx context.Context, page *notionapi.Page, adminUser *models.User) error {
	// 获取标题
	title, err := s.getPageTitle(page)
	if err != nil {
		return err // 没有标题跳过
	}

	// 检查是否已存在
	var post models.BlogPost
	result := s.db.Where("notion_page_id = ?", page.ID).First(&post)

	// 如果找到了，检查最后编辑时间
	notionLastEdited := page.LastEditedTime
	if result.Error == nil {
		if post.NotionLastEdit != nil && post.NotionLastEdit.Equal(notionLastEdited) {
			return nil // 没有变化，跳过
		}
	}

	// 获取 Blocks 并转换为 Markdown
	markdown, err := s.getPageContent(ctx, page.ID)
	if err != nil {
		return err
	}

	// 准备数据
	now := time.Now()
	slug := s.generateSlug(title)

	if result.Error == gorm.ErrRecordNotFound {
		// 创建新文章
		newPost := models.BlogPost{
			Title:          title,
			Slug:           slug,
			Content:        markdown,
			AuthorID:       adminUser.ID,
			Status:         "PUBLISHED", // 默认直接发布
			AccessLevel:    "PUBLIC",
			PublishedAt:    &now,
			LastEditedAt:   &now,
			NotionPageID:   page.ID.String(),
			NotionLastEdit: &notionLastEdited,
			CreatedAt:      now,
			UpdatedAt:      now,
		}
		return s.db.Create(&newPost).Error
	} else {
		// 更新现有文章
		post.Title = title
		post.Content = markdown
		post.LastEditedAt = &now
		post.NotionLastEdit = &notionLastEdited
		post.Status = "PUBLISHED" // 确保是发布状态
		return s.db.Save(&post).Error
	}
}

func (s *NotionService) getPageTitle(page *notionapi.Page) (string, error) {
	if page.Properties == nil {
		return "", fmt.Errorf("no properties")
	}

	// 遍历属性找到 Title 类型
	for _, prop := range page.Properties {
		if prop.GetType() == notionapi.PropertyTypeTitle {
			if titleProp, ok := prop.(*notionapi.TitleProperty); ok {
				var titleParts []string
				for _, t := range titleProp.Title {
					titleParts = append(titleParts, t.PlainText)
				}
				fullTitle := strings.Join(titleParts, "")
				if fullTitle == "" {
					return "", fmt.Errorf("empty title")
				}
				return fullTitle, nil
			}
		}
	}
	return "", fmt.Errorf("title property not found")
}

func (s *NotionService) getPageContent(ctx context.Context, pageID notionapi.ObjectID) (string, error) {
	var blocks []notionapi.Block
	cursor := notionapi.Cursor("")

	for {
		res, err := s.client.Block.GetChildren(ctx, notionapi.BlockID(pageID), &notionapi.Pagination{
			StartCursor: cursor,
			PageSize:    100,
		})
		if err != nil {
			return "", err
		}
		blocks = append(blocks, res.Results...)
		if !res.HasMore {
			break
		}
		cursor = notionapi.Cursor(res.NextCursor)
	}

	var mdBuilder strings.Builder
	for _, block := range blocks {
		mdBuilder.WriteString(s.blockToMarkdown(block))
		mdBuilder.WriteString("\n\n")
	}

	return mdBuilder.String(), nil
}

func (s *NotionService) blockToMarkdown(block notionapi.Block) string {
	switch b := block.(type) {
	case *notionapi.ParagraphBlock:
		return s.richTextToMarkdown(b.Paragraph.RichText)
	case *notionapi.Heading1Block:
		return "# " + s.richTextToMarkdown(b.Heading1.RichText)
	case *notionapi.Heading2Block:
		return "## " + s.richTextToMarkdown(b.Heading2.RichText)
	case *notionapi.Heading3Block:
		return "### " + s.richTextToMarkdown(b.Heading3.RichText)
	case *notionapi.BulletedListItemBlock:
		return "- " + s.richTextToMarkdown(b.BulletedListItem.RichText)
	case *notionapi.NumberedListItemBlock:
		return "1. " + s.richTextToMarkdown(b.NumberedListItem.RichText)
	case *notionapi.QuoteBlock:
		return "> " + s.richTextToMarkdown(b.Quote.RichText)
	case *notionapi.CodeBlock:
		lang := b.Code.Language
		code := s.richTextToMarkdown(b.Code.RichText)
		return fmt.Sprintf("```%s\n%s\n```", lang, code)
	case *notionapi.ImageBlock:
		if b.Image.Type == "external" {
			return fmt.Sprintf("![image](%s)", b.Image.External.URL)
		} else if b.Image.Type == "file" {
			return fmt.Sprintf("![image](%s)", b.Image.File.URL)
		}
		// TODO: Support more block types like ToDo, Toggle, etc.
	}
	return ""
}

func (s *NotionService) richTextToMarkdown(richText []notionapi.RichText) string {
	var sb strings.Builder
	for _, rt := range richText {
		text := rt.PlainText
		if rt.Annotations.Bold {
			text = "**" + text + "**"
		}
		if rt.Annotations.Italic {
			text = "*" + text + "*"
		}
		if rt.Annotations.Strikethrough {
			text = "~~" + text + "~~"
		}
		if rt.Annotations.Code {
			text = "`" + text + "`"
		}
		if rt.Href != "" {
			text = fmt.Sprintf("[%s](%s)", text, rt.Href)
		}
		sb.WriteString(text)
	}
	return sb.String()
}

func (s *NotionService) generateSlug(title string) string {
	// 简单的 Slug 生成逻辑，实际项目中可以使用库如 go-slug
	// 这里简单替换空格为 -
	return strings.ReplaceAll(title, " ", "-") + "-" + fmt.Sprintf("%d", time.Now().Unix())
}
