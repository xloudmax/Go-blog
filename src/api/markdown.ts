// src/api/markdown.ts
// Markdown API 兼容层 - 将 GraphQL API 封装为旧版 REST API 接口
// 提供向后兼容的函数，保持原有页面组件的接口不变

import client from '../graphql/client';
import { showErrorNotification } from '../components/ErrorNotification';
import { 
  FILE_CONTENT_QUERY, 
  FOLDERS_QUERY, 
  UPLOAD_MARKDOWN_FILE_MUTATION, 
  UPDATE_FILE_MUTATION 
} from './graphql/file';

// 类型定义
interface FileContentResult {
  fileContent?: {
    content: string;
  };
}

interface UploadFileResult {
  uploadMarkdownFile?: {
    success: boolean;
    message?: string;
  };
}

interface UpdateFileResult {
  updateFile?: boolean;
}

interface FoldersResult {
  folders?: Array<{
    name: string;
  }>;
}

// ==================== 兼容函数 ====================

/**
 * 获取文件内容
 * @param folder 文件夹名称
 * @param file 文件名
 * @returns 包含文件内容的Promise对象，格式为 {data: {content: string}}
 */
export const getContent = async (folder: string, file: string): Promise<{ data: { content: string } }> => {
  try {
    const result = await client.query({
      query: FILE_CONTENT_QUERY,
      variables: { folder, fileName: file },
      fetchPolicy: 'network-only', // 确保获取最新内容
    });

    const data = result.data as FileContentResult;
    return {
      data: {
        content: data?.fileContent?.content || '',
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '获取文件内容失败';
    showErrorNotification('获取文件内容失败', errorMessage);
    throw new Error(errorMessage);
  }
};

/**
 * 上传新文件
 * @param file File对象
 * @param folder 目标文件夹
 * @param title 文件标题
 * @returns Promise<void>
 */
export const uploadFile = async (file: File, folder: string, title: string): Promise<void> => {
  try {
    const result = await client.mutate({
      mutation: UPLOAD_MARKDOWN_FILE_MUTATION,
      variables: {
        input: {
          file,
          folder,
          title,
        },
      },
    });

    const data = result.data as UploadFileResult;
    if (!data?.uploadMarkdownFile?.success) {
      throw new Error(data?.uploadMarkdownFile?.message || '上传失败');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '上传失败';
    showErrorNotification('上传文件失败', errorMessage);
    // 保持与原有错误处理格式兼容
    const errorObj = {
      response: {
        data: {
          error: errorMessage
        }
      }
    };
    throw errorObj;
  }
};

/**
 * 更新文件内容
 * @param folder 文件夹名称
 * @param filename 文件名
 * @param content 新的文件内容
 * @returns Promise<void>
 */
export const updateFile = async (folder: string, filename: string, content: string): Promise<void> => {
  try {
    const result = await client.mutate({
      mutation: UPDATE_FILE_MUTATION,
      variables: {
        input: {
          folder,
          fileName: filename,
          content,
        },
      },
    });

    const data = result.data as UpdateFileResult;
    if (!data?.updateFile) {
      throw new Error('更新文件失败');
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '更新失败';
    showErrorNotification('更新文件失败', errorMessage);
    // 保持与原有错误处理格式兼容
    const errorObj = {
      response: {
        data: {
          error: errorMessage
        }
      }
    };
    throw errorObj;
  }
};

/**
 * 获取文件夹列表
 * @returns 包含文件夹数组的Promise对象，格式为 {data: {folders: string[]}}
 */
export const getFolders = async (): Promise<{ data: { folders: string[] } }> => {
  try {
    const result = await client.query({
      query: FOLDERS_QUERY,
      fetchPolicy: 'network-only', // 确保获取最新文件夹列表
    });

    const data = result.data as FoldersResult;
    return {
      data: {
        folders: data?.folders?.map((folder: { name: string }) => folder.name) || [],
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '获取文件夹列表失败';
    showErrorNotification('获取文件夹列表失败', errorMessage);
    throw new Error(errorMessage);
  }
};

// ==================== 默认导出（兼容性） ====================
export default {
  getContent,
  uploadFile,
  updateFile,
  getFolders,
};
