package services

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/99designs/gqlgen/graphql"
)

// FileService 文件服务
type FileService struct {
	uploadDir string
	maxSize   int64 // 最大文件大小（字节）
}

// ImageUploadResponse 图片上传响应
type ImageUploadResponse struct {
	ImageURL  string  `json:"imageUrl"`
	DeleteURL *string `json:"deleteUrl,omitempty"`
	Filename  string  `json:"filename"`
	Size      int     `json:"size"`
}

// NewFileService 创建文件服务实例
func NewFileService() *FileService {
	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}

	// 确保上传目录存在
	if err := os.MkdirAll(filepath.Join(uploadDir, "images"), 0755); err != nil {
		fmt.Printf("创建上传目录失败: %v\n", err)
	}

	return &FileService{
		uploadDir: uploadDir,
		maxSize:   10 * 1024 * 1024, // 10MB
	}
}

// UploadImage 上传图片
func (s *FileService) UploadImage(file graphql.Upload, userID uint) (*ImageUploadResponse, error) {
	if file.File == nil {
		return nil, fmt.Errorf("文件不能为空")
	}

	// 验证文件类型
	if !s.isValidImageType(file.Filename) {
		return nil, fmt.Errorf("不支持的文件类型，仅支持 JPG, PNG, GIF, WEBP")
	}

	// 清理文件名，防止路径遍历攻击
	safeFilename, err := sanitizeFilename(file.Filename)
	if err != nil {
		return nil, fmt.Errorf("非法的文件名: %w", err)
	}

	// 生成唯一文件名
	ext := filepath.Ext(safeFilename)
	filename := fmt.Sprintf("%d_%d%s", userID, time.Now().Unix(), ext)

	// 验证文件大小
	size, err := getFileSize(file.File)
	if err != nil {
		return nil, fmt.Errorf("读取文件大小失败: %w", err)
	}
	if size > s.maxSize {
		return nil, fmt.Errorf("文件大小超过限制（%d MB）", s.maxSize/(1024*1024))
	}

	// 构建完整路径（使用Clean防止路径遍历）
	fullPath := filepath.Join(s.uploadDir, "images", filename)
	fullPath = filepath.Clean(fullPath)

	// 确保最终路径在上传目录内（双重检查）
	if !strings.HasPrefix(fullPath, filepath.Clean(s.uploadDir)) {
		return nil, fmt.Errorf("非法的文件路径")
	}

	// 创建目标文件
	dst, err := os.Create(fullPath)
	if err != nil {
		return nil, fmt.Errorf("创建文件失败: %w", err)
	}
	defer dst.Close()

	// 复制文件内容
	written, err := io.Copy(dst, file.File)
	if err != nil {
		// 删除可能部分写入的文件
		os.Remove(fullPath)
		return nil, fmt.Errorf("保存文件失败: %w", err)
	}

	// 构建访问URL
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "http://localhost:11451"
	}
	imageURL := fmt.Sprintf("%s/uploads/images/%s", baseURL, filename)

	// 构建删除URL（管理员功能）
	deleteURL := fmt.Sprintf("%s/api/files/delete/%s", baseURL, filename)

	return &ImageUploadResponse{
		ImageURL:  imageURL,
		DeleteURL: &deleteURL,
		Filename:  filename,
		Size:      int(written),
	}, nil
}

// DeleteImage 删除图片
func (s *FileService) DeleteImage(filename string, userID uint, userRole string) error {
	// 清理文件名，防止路径遍历
	safeFilename, err := sanitizeFilename(filename)
	if err != nil {
		return fmt.Errorf("非法的文件名: %w", err)
	}

	// 构建文件路径
	fullPath := filepath.Join(s.uploadDir, "images", safeFilename)
	fullPath = filepath.Clean(fullPath)

	// 确保路径在上传目录内
	if !strings.HasPrefix(fullPath, filepath.Clean(s.uploadDir)) {
		return fmt.Errorf("非法的文件路径")
	}

	// 检查文件是否存在
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		return fmt.Errorf("文件不存在")
	}

	// 权限检查：只有管理员或文件所有者可以删除
	// 从文件名中提取用户ID（格式：userID_timestamp.ext）
	parts := strings.Split(filename, "_")
	if len(parts) >= 2 && userRole != "ADMIN" {
		// 提取文件名中的用户ID进行权限验证（简化实现）
		// 实际项目中应该在数据库中记录文件归属
		if !strings.HasPrefix(filename, fmt.Sprintf("%d_", userID)) {
			return fmt.Errorf("权限不足")
		}
	}

	// 删除文件
	if err := os.Remove(fullPath); err != nil {
		return fmt.Errorf("删除文件失败: %w", err)
	}

	return nil
}

// isValidImageType 验证是否为有效的图片类型
func (s *FileService) isValidImageType(filename string) bool {
	ext := strings.ToLower(filepath.Ext(filename))
	validExtensions := []string{".jpg", ".jpeg", ".png", ".gif", ".webp"}

	for _, validExt := range validExtensions {
		if ext == validExt {
			return true
		}
	}

	return false
}

// GetImagePath 获取图片的物理路径
func (s *FileService) GetImagePath(filename string) string {
	return filepath.Join(s.uploadDir, "images", filename)
}

// ListUserImages 获取用户上传的图片列表
func (s *FileService) ListUserImages(userID uint) ([]string, error) {
	imageDir := filepath.Join(s.uploadDir, "images")

	entries, err := os.ReadDir(imageDir)
	if err != nil {
		return nil, fmt.Errorf("读取目录失败: %w", err)
	}

	var userImages []string
	prefix := fmt.Sprintf("%d_", userID)

	for _, entry := range entries {
		if !entry.IsDir() && strings.HasPrefix(entry.Name(), prefix) {
			userImages = append(userImages, entry.Name())
		}
	}

	return userImages, nil
}

// CleanupOldFiles 清理旧文件（管理员功能）
func (s *FileService) CleanupOldFiles(daysOld int) error {
	imageDir := filepath.Join(s.uploadDir, "images")

	entries, err := os.ReadDir(imageDir)
	if err != nil {
		return fmt.Errorf("读取目录失败: %w", err)
	}

	cutoff := time.Now().AddDate(0, 0, -daysOld)
	var deletedCount int

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		if info.ModTime().Before(cutoff) {
			fullPath := filepath.Join(imageDir, entry.Name())
			if err := os.Remove(fullPath); err != nil {
				fmt.Printf("删除旧文件失败 %s: %v\n", entry.Name(), err)
			} else {
				deletedCount++
			}
		}
	}

	fmt.Printf("清理完成，删除了 %d 个旧文件\n", deletedCount)
	return nil
}

// sanitizeFilename 清理文件名，防止路径遍历攻击
func sanitizeFilename(filename string) (string, error) {
	// 使用filepath.Base去除任何路径成分
	clean := filepath.Base(filename)

	// 禁止 .. 和隐藏文件
	if strings.Contains(clean, "..") || strings.HasPrefix(clean, ".") {
		return "", fmt.Errorf("文件名包含非法字符")
	}

	// 移除路径分隔符（额外的安全检查）
	if strings.ContainsAny(clean, "/\\") {
		return "", fmt.Errorf("文件名包含路径分隔符")
	}

	// 只允许字母数字、下划线、连字符和点号
	if !regexp.MustCompile(`^[a-zA-Z0-9_.-]+$`).MatchString(clean) {
		return "", fmt.Errorf("文件名包含非法字符")
	}

	// 限制文件名长度
	if len(clean) > 255 {
		return "", fmt.Errorf("文件名过长")
	}

	return clean, nil
}

// getFileSize 获取文件大小
func getFileSize(file io.ReadSeeker) (int64, error) {
	// 移动到文件末尾获取大小
	size, err := file.Seek(0, io.SeekEnd)
	if err != nil {
		return 0, err
	}

	// 重置文件指针到开始
	_, err = file.Seek(0, io.SeekStart)
	if err != nil {
		return 0, err
	}

	return size, nil
}