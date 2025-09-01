import {gql, useMutation, useQuery} from '@apollo/client';

// ==================== QUERIES ====================

// 获取文件夹列表
export const FOLDERS_QUERY = gql`
  query Folders {
    folders {
      name
      path
      createdAt
      fileCount
    }
  }
`;

// 获取文件列表
export const FILES_QUERY = gql`
  query Files($folder: String!) {
    files(folder: $folder) {
      name
      folder
      size
      createdAt
      updatedAt
    }
  }
`;

// 获取文件内容
export const FILE_CONTENT_QUERY = gql`
  query FileContent($folder: String!, $fileName: String!) {
    fileContent(folder: $folder, fileName: $fileName) {
      name
      folder
      content
      size
      createdAt
      updatedAt
    }
  }
`;

// ==================== MUTATIONS ====================

// 创建文件夹
export const CREATE_FOLDER_MUTATION = gql`
  mutation CreateFolder($input: CreateFolderInput!) {
    createFolder(input: $input) {
      name
      path
      createdAt
      fileCount
    }
  }
`;

// 上传Markdown文件
export const UPLOAD_MARKDOWN_FILE_MUTATION = gql`
  mutation UploadMarkdownFile($input: UploadMarkdownFileInput!) {
    uploadMarkdownFile(input: $input) {
      success
      message
      filePath
      fileName
    }
  }
`;

// 更新文件
export const UPDATE_FILE_MUTATION = gql`
  mutation UpdateFile($input: UpdateFileInput!) {
    updateFile(input: $input) {
      name
      folder
      content
      size
      updatedAt
    }
  }
`;

// 删除文件
export const DELETE_FILE_MUTATION = gql`
  mutation DeleteFile($folder: String!, $fileName: String!) {
    deleteFile(folder: $folder, fileName: $fileName) {
      success
      message
      code
    }
  }
`;

// 删除文件夹
export const DELETE_FOLDER_MUTATION = gql`
  mutation DeleteFolder($name: String!) {
    deleteFolder(name: $name) {
      success
      message
      code
    }
  }
`;

// 文件夹列表 Hook
export const useFolders = () => {
    const {data, loading, error, refetch} = useQuery(FOLDERS_QUERY, {
        errorPolicy: 'all',
    });

    return {
        folders: data?.folders || [],
        loading,
        error,
        refetch,
    };
};

// 文件列表 Hook
export const useFiles = (folder: string) => {
    const {data, loading, error, refetch} = useQuery(FILES_QUERY, {
        variables: {folder},
        skip: !folder,
        errorPolicy: 'all',
    });

    return {
        files: data?.files || [],
        loading,
        error,
        refetch,
    };
};

// 文件内容 Hook
// 文件操作 Hook
export const useFileOperations = () => {
    // 创建文件夹
    const [createFolderMutation, {
        loading: createFolderLoading,
        error: createFolderError
    }] = useMutation(CREATE_FOLDER_MUTATION, {
        refetchQueries: [{query: FOLDERS_QUERY}],
        awaitRefetchQueries: true,
    });

    // 上传Markdown文件
    const [uploadMarkdownFileMutation, {
        loading: uploadFileLoading,
        error: uploadFileError
    }] = useMutation(UPLOAD_MARKDOWN_FILE_MUTATION);

    // 更新文件
    const [updateFileMutation, {
        loading: updateFileLoading,
        error: updateFileError
    }] = useMutation(UPDATE_FILE_MUTATION);

    // 删除文件
    const [deleteFileMutation, {
        loading: deleteFileLoading,
        error: deleteFileError
    }] = useMutation(DELETE_FILE_MUTATION);

    // 删除文件夹
    const [deleteFolderMutation, {
        loading: deleteFolderLoading,
        error: deleteFolderError
    }] = useMutation(DELETE_FOLDER_MUTATION, {
        refetchQueries: [{query: FOLDERS_QUERY}],
        awaitRefetchQueries: true,
    });

    // API 函数
    const createFolder = async (name: string) => {
        const result = await createFolderMutation({
            variables: {
                input: {name},
            },
        });
        return result.data?.createFolder;
    };

    const uploadMarkdownFile = async (file: File, folder: string, title: string) => {
        const result = await uploadMarkdownFileMutation({
            variables: {
                input: {
                    file,
                    folder,
                    title,
                },
            },
            update: (cache: any) => {
                // 更新文件列表缓存
                cache.refetchQueries({
                    include: [FILES_QUERY],
                });
            },
        });
        return result.data?.uploadMarkdownFile;
    };

    const updateFile = async (folder: string, fileName: string, content: string) => {
        const result = await updateFileMutation({
            variables: {
                input: {
                    folder,
                    fileName,
                    content,
                },
            },
            update: (cache: any, {data}: any) => {
                if (data?.updateFile) {
                    // 更新文件内容缓存
                    cache.writeQuery({
                        query: FILE_CONTENT_QUERY,
                        variables: {folder, fileName},
                        data: {fileContent: data.updateFile},
                    });
                }
            },
        });
        return result.data?.updateFile;
    };

    const deleteFile = async (folder: string, fileName: string) => {
        const result = await deleteFileMutation({
            variables: {folder, fileName},
            update: (cache: any) => {
                // 从文件列表缓存中移除
                const existingFiles = cache.readQuery({
                    query: FILES_QUERY,
                    variables: {folder},
                });

                if (existingFiles) {
                    cache.writeQuery({
                        query: FILES_QUERY,
                        variables: {folder},
                        data: {
                            files: existingFiles.files.filter((file: any) => file.name !== fileName),
                        },
                    });
                }

                // 清除文件内容缓存
                cache.evict({
                    fieldName: 'fileContent',
                    args: {folder, fileName},
                });
            },
        });
        return result.data?.deleteFile;
    };

    const deleteFolder = async (name: string) => {
        const result = await deleteFolderMutation({
            variables: {name},
            update: (cache) => {
                // 从文件夹列表缓存中移除
                const existingFolders: any = cache.readQuery({
                    query: FOLDERS_QUERY,
                });

                if (existingFolders) {
                    cache.writeQuery({
                        query: FOLDERS_QUERY,
                        data: {
                            folders: existingFolders.folders.filter((folder: any) => folder.name !== name),
                        },
                    });
                }

                // 清除相关文件列表缓存
                cache.evict({
                    fieldName: 'files',
                    args: {folder: name},
                });
            },
        });
        return result.data?.deleteFolder;
    };

    return {
        // API 函数
        createFolder,
        uploadMarkdownFile,
        updateFile,
        deleteFile,
        deleteFolder,

        // 加载状态
        loading: {
            createFolder: createFolderLoading,
            uploadFile: uploadFileLoading,
            updateFile: updateFileLoading,
            deleteFile: deleteFileLoading,
            deleteFolder: deleteFolderLoading,
        },

        // 错误状态
        errors: {
            createFolder: createFolderError,
            uploadFile: uploadFileError,
            updateFile: updateFileError,
            deleteFile: deleteFileError,
            deleteFolder: deleteFolderError,
        },
    };
};
