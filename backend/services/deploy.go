package services

import (
	"context"
	"encoding/base64"
	"github.com/goccy/go-json"
	"fmt"
	"os"
	"path/filepath"
	"repair-platform/models"
	"strings"

	"github.com/google/go-github/v60/github"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
)

type DeployService struct {
	db *gorm.DB
}

func NewDeployService(db *gorm.DB) *DeployService {
	return &DeployService{db: db}
}

// ExportDataToJSON 导出所有已发布文章到指定的静态目录，并包含前端静态资源
func (s *DeployService) ExportDataToJSON(targetDir string) error {
	// 1. 复制前端静态资源 (如果存在)
	// 在单体代码库结构下，dist-static 应该在 backend 的上一级目录
	staticAssetDir := "../dist-static"
	if _, err := os.Stat(staticAssetDir); err == nil {
		if err := copyDir(staticAssetDir, targetDir); err != nil {
			return fmt.Errorf("failed to copy static assets: %w", err)
		}

		// 检查并重命名 index.static.html 为 index.html
		staticHTML := filepath.Join(targetDir, "index.static.html")
		if _, err := os.Stat(staticHTML); err == nil {
			if err := os.Rename(staticHTML, filepath.Join(targetDir, "index.html")); err != nil {
				return fmt.Errorf("failed to rename index.static.html: %w", err)
			}
		}
	}

	// 创建数据目录
	dataDir := filepath.Join(targetDir, "static")
	if err := os.MkdirAll(filepath.Join(dataDir, "posts"), 0755); err != nil {
		return fmt.Errorf("failed to create data directory: %w", err)
	}

	// 2. 获取所有已发布文章
	var posts []models.BlogPost
	if err := s.db.Preload("Author").Preload("Stats").Where("status = ?", "PUBLISHED").Find(&posts).Error; err != nil {
		return fmt.Errorf("failed to fetch posts: %w", err)
	}

	// 3. 生成 posts.json (列表)
	postsJSON, _ := json.Marshal(posts)
	if err := os.WriteFile(filepath.Join(dataDir, "posts.json"), postsJSON, 0644); err != nil {
		return fmt.Errorf("failed to write posts.json: %w", err)
	}

	// 4. 生成每个文章的详细 JSON
	for _, post := range posts {
		postJSON, _ := json.Marshal(post)
		if err := os.WriteFile(filepath.Join(dataDir, "posts", post.Slug+".json"), postJSON, 0644); err != nil {
			return fmt.Errorf("failed to write post %s.json: %w", post.Slug, err)
		}
	}

	// 5. 生成 dashboard.json (热门/最新/标签)
	dashboard := map[string]interface{}{
		"popularPosts": posts, // 简化实现
		"recentPosts":  posts,
		"tags":         extractTags(posts),
	}
	dashboardJSON, _ := json.Marshal(dashboard)
	if err := os.WriteFile(filepath.Join(dataDir, "dashboard.json"), dashboardJSON, 0644); err != nil {
		return fmt.Errorf("failed to write dashboard.json: %w", err)
	}

	return nil
}

// copyDir 递归复制目录
func copyDir(src string, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// 计算目标路径
		relPath, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		targetPath := filepath.Join(dst, relPath)

		if info.IsDir() {
			return os.MkdirAll(targetPath, info.Mode())
		}

		// 复制文件
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		return os.WriteFile(targetPath, data, info.Mode())
	})
}

func extractTags(posts []models.BlogPost) []map[string]interface{} {
	tagMap := make(map[string]int)
	for _, post := range posts {
		// 这里由于 BlogPost.Tags 是 string (逗号分隔)，简单处理
		tags := strings.Split(post.Tags, ",")
		for _, t := range tags {
			t = strings.TrimSpace(t)
			if t != "" {
				tagMap[t]++
			}
		}
	}
	var tags []map[string]interface{}
	for name, count := range tagMap {
		tags = append(tags, map[string]interface{}{
			"name":  name,
			"count": count,
		})
	}
	return tags
}

// DeployToGitHubPages 推送到 GitHub (gh-pages 分支)
func (s *DeployService) DeployToGitHubPages(ctx context.Context, repoOwner, repoName, token, sourceDir string) error {
	ts := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: token},
	)
	tc := oauth2.NewClient(ctx, ts)
	client := github.NewClient(tc)

	targetBranch := "gh-pages"

	// 1. 获取最新 commit 的 SHA (从 gh-pages 或 默认分支)
	var baseTreeSHA string
	ref, _, err := client.Git.GetRef(ctx, repoOwner, repoName, "refs/heads/"+targetBranch)
	if err != nil {
		// 如果 gh-pages 不存在，从默认分支开始
		repo, _, err := client.Repositories.Get(ctx, repoOwner, repoName)
		if err != nil {
			return fmt.Errorf("failed to get repository: %w", err)
		}
		defaultBranch := repo.GetDefaultBranch()
		
		defaultRef, _, err := client.Git.GetRef(ctx, repoOwner, repoName, "refs/heads/"+defaultBranch)
		if err != nil {
			return fmt.Errorf("failed to get default branch ref: %w", err)
		}
		baseTreeSHA = defaultRef.Object.GetSHA()
	} else {
		baseTreeSHA = ref.Object.GetSHA()
	}

	// 2. 创建 Tree (使用 Blob 方式处理二进制文件)
	var entries []*github.TreeEntry
	err = filepath.Walk(sourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		relPath, _ := filepath.Rel(sourceDir, path)
		content, _ := os.ReadFile(path)

		// 为每个文件创建 Blob (支持二进制)
		contentBase64 := base64.StdEncoding.EncodeToString(content)
		blob, _, err := client.Git.CreateBlob(ctx, repoOwner, repoName, &github.Blob{
			Content:  github.String(contentBase64),
			Encoding: github.String("base64"),
		})
		if err != nil {
			return err
		}

		entries = append(entries, &github.TreeEntry{
			Path: github.String(relPath),
			Type: github.String("blob"),
			SHA:  blob.SHA,
			Mode: github.String("100644"),
		})
		return nil
	})
	if err != nil {
		return fmt.Errorf("failed to read source directory and create blobs: %w", err)
	}

	tree, _, err := client.Git.CreateTree(ctx, repoOwner, repoName, baseTreeSHA, entries)
	if err != nil {
		return fmt.Errorf("failed to create git tree: %w", err)
	}

	// 3. 创建 Commit
	commit, _, err := client.Git.CreateCommit(ctx, repoOwner, repoName, &github.Commit{
		Message: github.String("Deploy static blog via C404 Client"),
		Tree:    tree,
		Parents: []*github.Commit{{SHA: github.String(baseTreeSHA)}},
	}, &github.CreateCommitOptions{})
	if err != nil {
		return fmt.Errorf("failed to create commit: %w", err)
	}

	// 4. 更新或创建 Ref
	if ref != nil {
		ref.Object.SHA = commit.SHA
		_, _, err = client.Git.UpdateRef(ctx, repoOwner, repoName, ref, false)
	} else {
		_, _, err = client.Git.CreateRef(ctx, repoOwner, repoName, &github.Reference{
			Ref:    github.String("refs/heads/" + targetBranch),
			Object: &github.GitObject{SHA: commit.SHA},
		})
	}
	if err != nil {
		return fmt.Errorf("failed to update/create ref: %w", err)
	}

	return nil
}
