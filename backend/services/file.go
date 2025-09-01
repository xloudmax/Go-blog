package services

import (
	"fmt"
	"os"
	"path/filepath"
	"repair-platform/config"
	"repair-platform/middleware"
	"strings"
	"time"
)

// FileService 文件管理服务
type FileService struct {
	BasePath string // 基础存储路径
}

// NewFileService 创建文件管理服务实例
func NewFileService() *FileService {
	cfg := config.GetConfig()
	return &FileService{
		BasePath: cfg.BasePath,
	}
}

// FileFolder 文件夹信息
type FileFolder struct {
	Name      string    `json:"name"`
	Path      string    `json:"path"`
	CreatedAt time.Time `json:"createdAt"`
	FileCount int       `json:"fileCount"`
}

// MarkdownFile Markdown文件信息
type MarkdownFile struct {
	Name      string    `json:"name"`
	Folder    string    `json:"folder"`
	Content   string    `json:"content,omitempty"`
	Size      int64     `json:"size"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// FileUploadResult 文件上传结果
type FileUploadResult struct {
	Success  bool   `json:"success"`
	Message  string `json:"message"`
	FilePath string `json:"filePath,omitempty"`
	FileName string `json:"fileName,omitempty"`
}

// isValidFolderName 验证文件夹名称是否有效
func (fs *FileService) isValidFolderName(name string) bool {
	// 支持字母、数字、下划线和中文字符
	for _, char := range name {
		if !(char == '_' ||
			(char >= 'a' && char <= 'z') ||
			(char >= 'A' && char <= 'Z') ||
			(char >= '0' && char <= '9') ||
			(char >= 0x4E00 && char <= 0x9FA5)) {
			return false
		}
	}
	return len(name) > 0 && len(name) <= 50
}

// isPathInsideBase 验证路径是否在基础路径内（安全检查）
func (fs *FileService) isPathInsideBase(path string) bool {
	absBase, _ := filepath.Abs(fs.BasePath)
	absPath, _ := filepath.Abs(path)
	return strings.HasPrefix(absPath, absBase)
}

// ensureFolderExists 确保文件夹路径存在
func (fs *FileService) ensureFolderExists(folderPath string) error {
	logger := middleware.GetLogger()
	err := os.MkdirAll(folderPath, os.ModePerm)
	if err != nil {
		logger.Errorw("确保文件夹存在失败", "folder", folderPath, "error", err)
	}
	return err
}

// GetFolders 获取所有文件夹列表
func (fs *FileService) GetFolders() ([]*FileFolder, error) {
	logger := middleware.GetLogger()
	logger.Infow("获取文件夹列表", "basePath", fs.BasePath)

	// 确保基础路径存在
	if err := fs.ensureFolderExists(fs.BasePath); err != nil {
		return nil, fmt.Errorf("创建基础路径失败: %w", err)
	}

	entries, err := os.ReadDir(fs.BasePath)
	if err != nil {
		logger.Errorw("读取基础路径失败", "path", fs.BasePath, "error", err)
		return nil, fmt.Errorf("读取文件夹失败: %w", err)
	}

	var folders []*FileFolder
	for _, entry := range entries {
		if entry.IsDir() {
			folderPath := filepath.Join(fs.BasePath, entry.Name())
			info, err := entry.Info()
			if err != nil {
				logger.Warnw("获取文件夹信息失败", "folder", entry.Name(), "error", err)
				continue
			}

			// 统计文件夹中的文件数量
			fileCount, err := fs.countFilesInFolder(entry.Name())
			if err != nil {
				logger.Warnw("统计文件夹文件数量失败", "folder", entry.Name(), "error", err)
				fileCount = 0
			}

			folders = append(folders, &FileFolder{
				Name:      entry.Name(),
				Path:      folderPath,
				CreatedAt: info.ModTime(),
				FileCount: fileCount,
			})
		}
	}

	logger.Infow("获取文件夹列表成功", "count", len(folders))
	return folders, nil
}

// CreateFolder 创建新文件夹
func (fs *FileService) CreateFolder(name string) (*FileFolder, error) {
	logger := middleware.GetLogger()
	logger.Infow("创建文件夹", "name", name)

	if !fs.isValidFolderName(name) {
		return nil, fmt.Errorf("文件夹名称包含非法字符或长度不符合要求")
	}

	folderPath := filepath.Join(fs.BasePath, name)
	if !fs.isPathInsideBase(folderPath) {
		return nil, fmt.Errorf("非法路径")
	}

	// 检查文件夹是否已存在
	if _, err := os.Stat(folderPath); !os.IsNotExist(err) {
		return nil, fmt.Errorf("文件夹已存在")
	}

	if err := fs.ensureFolderExists(folderPath); err != nil {
		return nil, fmt.Errorf("创建文件夹失败: %w", err)
	}

	logger.Infow("文件夹创建成功", "name", name, "path", folderPath)
	return &FileFolder{
		Name:      name,
		Path:      folderPath,
		CreatedAt: time.Now(),
		FileCount: 0,
	}, nil
}

// GetFiles 获取指定文件夹中的文件列表
func (fs *FileService) GetFiles(folderName string) ([]*MarkdownFile, error) {
	logger := middleware.GetLogger()
	logger.Infow("获取文件列表", "folder", folderName)

	if folderName == "" {
		return nil, fmt.Errorf("文件夹名称不能为空")
	}

	folderPath := filepath.Join(fs.BasePath, folderName)
	if !fs.isPathInsideBase(folderPath) {
		return nil, fmt.Errorf("非法路径")
	}

	entries, err := os.ReadDir(folderPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("文件夹不存在")
		}
		logger.Errorw("读取文件夹内容失败", "path", folderPath, "error", err)
		return nil, fmt.Errorf("读取文件夹失败: %w", err)
	}

	var files []*MarkdownFile
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".md") {
			info, err := entry.Info()
			if err != nil {
				logger.Warnw("获取文件信息失败", "file", entry.Name(), "error", err)
				continue
			}

			files = append(files, &MarkdownFile{
				Name:      entry.Name(),
				Folder:    folderName,
				Size:      info.Size(),
				CreatedAt: info.ModTime(),
				UpdatedAt: info.ModTime(),
			})
		}
	}

	logger.Infow("获取文件列表成功", "folder", folderName, "count", len(files))
	return files, nil
}

// GetFileContent 获取文件内容
func (fs *FileService) GetFileContent(folderName, fileName string) (*MarkdownFile, error) {
	logger := middleware.GetLogger()
	logger.Infow("获取文件内容", "folder", folderName, "file", fileName)

	if folderName == "" || fileName == "" {
		return nil, fmt.Errorf("文件夹或文件名不能为空")
	}

	filePath := filepath.Join(fs.BasePath, folderName, fileName)
	if !fs.isPathInsideBase(filePath) {
		return nil, fmt.Errorf("非法路径")
	}

	content, err := os.ReadFile(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("文件不存在")
		}
		logger.Errorw("读取文件失败", "path", filePath, "error", err)
		return nil, fmt.Errorf("读取文件失败: %w", err)
	}

	info, err := os.Stat(filePath)
	if err != nil {
		logger.Errorw("获取文件信息失败", "path", filePath, "error", err)
		return nil, fmt.Errorf("获取文件信息失败: %w", err)
	}

	logger.Infow("获取文件内容成功", "folder", folderName, "file", fileName, "size", len(content))
	return &MarkdownFile{
		Name:      fileName,
		Folder:    folderName,
		Content:   string(content),
		Size:      info.Size(),
		CreatedAt: info.ModTime(),
		UpdatedAt: info.ModTime(),
	}, nil
}

// UpdateFile 更新文件内容
func (fs *FileService) UpdateFile(folderName, fileName, content string) (*MarkdownFile, error) {
	logger := middleware.GetLogger()
	logger.Infow("更新文件内容", "folder", folderName, "file", fileName, "contentLength", len(content))

	if folderName == "" || fileName == "" {
		return nil, fmt.Errorf("文件夹或文件名不能为空")
	}

	if !strings.HasSuffix(fileName, ".md") {
		return nil, fmt.Errorf("只支持 Markdown 文件")
	}

	filePath := filepath.Join(fs.BasePath, folderName, fileName)
	if !fs.isPathInsideBase(filePath) {
		return nil, fmt.Errorf("非法路径")
	}

	// 确保文件夹存在
	folderPath := filepath.Join(fs.BasePath, folderName)
	if err := fs.ensureFolderExists(folderPath); err != nil {
		return nil, fmt.Errorf("创建文件夹失败: %w", err)
	}

	err := os.WriteFile(filePath, []byte(content), 0644)
	if err != nil {
		logger.Errorw("写入文件失败", "path", filePath, "error", err)
		return nil, fmt.Errorf("写入文件失败: %w", err)
	}

	info, err := os.Stat(filePath)
	if err != nil {
		logger.Errorw("获取文件信息失败", "path", filePath, "error", err)
		return nil, fmt.Errorf("获取文件信息失败: %w", err)
	}

	logger.Infow("更新文件内容成功", "folder", folderName, "file", fileName, "size", info.Size())
	return &MarkdownFile{
		Name:      fileName,
		Folder:    folderName,
		Content:   content,
		Size:      info.Size(),
		CreatedAt: info.ModTime(),
		UpdatedAt: info.ModTime(),
	}, nil
}

// DeleteFile 删除文件
func (fs *FileService) DeleteFile(folderName, fileName string) error {
	logger := middleware.GetLogger()
	logger.Infow("删除文件", "folder", folderName, "file", fileName)

	if folderName == "" || fileName == "" {
		return fmt.Errorf("文件夹或文件名不能为空")
	}

	filePath := filepath.Join(fs.BasePath, folderName, fileName)
	if !fs.isPathInsideBase(filePath) {
		return fmt.Errorf("非法路径")
	}

	err := os.Remove(filePath)
	if err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("文件不存在")
		}
		logger.Errorw("删除文件失败", "path", filePath, "error", err)
		return fmt.Errorf("删除文件失败: %w", err)
	}

	logger.Infow("删除文件成功", "folder", folderName, "file", fileName)
	return nil
}

// DeleteFolder 删除文件夹
func (fs *FileService) DeleteFolder(name string) error {
	logger := middleware.GetLogger()
	logger.Infow("删除文件夹", "name", name)

	if name == "" {
		return fmt.Errorf("文件夹名称不能为空")
	}

	folderPath := filepath.Join(fs.BasePath, name)
	if !fs.isPathInsideBase(folderPath) {
		return fmt.Errorf("非法路径")
	}

	// 检查文件夹是否为空
	entries, err := os.ReadDir(folderPath)
	if err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("文件夹不存在")
		}
		return fmt.Errorf("读取文件夹失败: %w", err)
	}

	if len(entries) > 0 {
		return fmt.Errorf("文件夹不为空，无法删除")
	}

	err = os.Remove(folderPath)
	if err != nil {
		logger.Errorw("删除文件夹失败", "path", folderPath, "error", err)
		return fmt.Errorf("删除文件夹失败: %w", err)
	}

	logger.Infow("删除文件夹成功", "name", name)
	return nil
}

// UploadMarkdownFile 上传 Markdown 文件
func (fs *FileService) UploadMarkdownFile(content []byte, folderName, title string) (*FileUploadResult, error) {
	logger := middleware.GetLogger()
	logger.Infow("上传 Markdown 文件", "folder", folderName, "title", title, "size", len(content))

	if folderName == "" || title == "" {
		return nil, fmt.Errorf("文件夹名称和标题不能为空")
	}

	// 生成文件名
	fileName := title
	if !strings.HasSuffix(fileName, ".md") {
		fileName += ".md"
	}

	// 确保文件夹存在
	folderPath := filepath.Join(fs.BasePath, folderName)
	if err := fs.ensureFolderExists(folderPath); err != nil {
		return nil, fmt.Errorf("创建文件夹失败: %w", err)
	}

	filePath := filepath.Join(folderPath, fileName)
	if !fs.isPathInsideBase(filePath) {
		return nil, fmt.Errorf("非法路径")
	}

	// 检查文件是否已存在
	if _, err := os.Stat(filePath); !os.IsNotExist(err) {
		return nil, fmt.Errorf("文件已存在")
	}

	err := os.WriteFile(filePath, content, 0644)
	if err != nil {
		logger.Errorw("写入文件失败", "path", filePath, "error", err)
		return nil, fmt.Errorf("写入文件失败: %w", err)
	}

	logger.Infow("上传 Markdown 文件成功", "folder", folderName, "file", fileName, "path", filePath)
	return &FileUploadResult{
		Success:  true,
		Message:  "文件上传成功",
		FilePath: filePath,
		FileName: fileName,
	}, nil
}

// countFilesInFolder 统计文件夹中的文件数量
func (fs *FileService) countFilesInFolder(folderName string) (int, error) {
	folderPath := filepath.Join(fs.BasePath, folderName)
	entries, err := os.ReadDir(folderPath)
	if err != nil {
		return 0, err
	}

	count := 0
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".md") {
			count++
		}
	}
	return count, nil
}
