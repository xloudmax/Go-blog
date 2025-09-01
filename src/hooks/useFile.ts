import { useState, useCallback, useMemo } from 'react';
import { 
  useFolders, 
  useFiles, 
  useFileOperations
} from '../api/graphql';

// 文件管理器hook
export const useFileManager = () => {
  const { folders, loading: loadingFolders, refetch: refetchFolders } = useFolders();
  const { createFolder, uploadMarkdownFile, deleteFile, deleteFolder, loading, errors } = useFileOperations();
  
  const [currentFolder, setCurrentFolder] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  
  // 获取当前文件夹的文件
  const { files, loading: loadingFiles, refetch: refetchFiles } = useFiles(currentFolder);
  
  // 创建文件夹
  const handleCreateFolder = useCallback(async (name: string) => {
    const result = await createFolder(name);
    await refetchFolders();
    return result;
  }, [createFolder, refetchFolders]);

  // 上传文件
  const handleUploadFile = useCallback(async (file: File, folder: string, title: string) => {
    const result = await uploadMarkdownFile(file, folder, title);
    await refetchFiles();
    return result;
  }, [uploadMarkdownFile, refetchFiles]);

  // 删除文件
  const handleDeleteFile = useCallback(async (folder: string, fileName: string) => {
    const result = await deleteFile(folder, fileName);
    await refetchFiles();
    setSelectedFiles(prev => prev.filter(f => f !== fileName));
    return result;
  }, [deleteFile, refetchFiles]);

  // 删除文件夹
  const handleDeleteFolder = useCallback(async (name: string) => {
    const result = await deleteFolder(name);
    await refetchFolders();
    if (currentFolder === name) {
      setCurrentFolder('');
    }
    return result;
  }, [deleteFolder, refetchFolders, currentFolder]);
  
  // 批量删除选中的文件
  const handleDeleteSelectedFiles = useCallback(async () => {
    if (!currentFolder || selectedFiles.length === 0) return;
    
    const results = [];
    for (const fileName of selectedFiles) {
      try {
        const result = await deleteFile(currentFolder, fileName);
        results.push({ fileName, success: true, result });
      } catch (error) {
        results.push({ fileName, success: false, error });
      }
    }
    
    await refetchFiles();
    setSelectedFiles([]);
    return results;
  }, [currentFolder, selectedFiles, deleteFile, refetchFiles]);
  
  // 选择文件
  const toggleFileSelection = useCallback((fileName: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileName) 
        ? prev.filter(f => f !== fileName)
        : [...prev, fileName]
    );
  }, []);
  
  const selectAllFiles = useCallback(() => {
    setSelectedFiles(files.map((f: { name: any; }) => f.name));
  }, [files]);
  
  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
  }, []);
  
  // 计算状态
  const totalFiles = useMemo(() => 
    folders.reduce((sum: any, folder: { fileCount: any; }) => sum + folder.fileCount, 0),
    [folders]
  );
  
  const currentFolderData = useMemo(() => 
    folders.find((f: { name: string; }) => f.name === currentFolder),
    [folders, currentFolder]
  );
  
  return {
    // 数据
    folders,
    files,
    currentFolder,
    currentFolderData,
    selectedFiles,
    totalFiles,
    
    // 状态
    loading: loadingFolders || loadingFiles || loading.createFolder || loading.uploadFile || loading.deleteFile || loading.deleteFolder,
    errors,
    
    // 操作
    setCurrentFolder,
    createFolder: handleCreateFolder,
    uploadFile: handleUploadFile,
    deleteFile: handleDeleteFile,
    deleteFolder: handleDeleteFolder,
    deleteSelectedFiles: handleDeleteSelectedFiles,
    
    // 选择操作
    toggleFileSelection,
    selectAllFiles,
    clearSelection,
    
    // 刷新操作
    refetchFolders,
    refetchFiles,
  };
};

// 文件编辑器hook
// 图片上传hook
// 文件搜索和过滤hook