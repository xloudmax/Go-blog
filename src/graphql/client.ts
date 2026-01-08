import { ApolloClient, InMemoryCache, from, Observable } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { fromPromise } from '@apollo/client/link/utils';
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { cacheConfig } from './cache-config';
import errorHandler from '@/services/errorHandler';

// 加载Apollo Client错误信息（开发环境）
if (import.meta.env.DEV || process.env.NODE_ENV !== "production") {
  loadDevMessages();
  loadErrorMessages();
}

// 创建HTTP链接
const uploadLink = createUploadLink({
  uri: `${import.meta.env.VITE_API_BASE_URL || "http://localhost:11451/"}graphql`,
});

// 认证链接 - 自动添加JWT token到请求头
const authLink = setContext((_, { headers }) => {
  let token = localStorage.getItem('token');
  
  // 验证 token 是否有效
  if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
    token = null;
  }
  
  // 基本的JWT格式验证（应该有3个部分，用.分隔）
  if (token && token.split('.').length !== 3) {
    // Invalid JWT token format, removing from storage
    localStorage.removeItem('token');
    token = null;
  }
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  };
});

// 获取新Token的逻辑
let isRefreshing = false;
let pendingRequests: any[] = [];

const resolvePendingRequests = () => {
  pendingRequests.map(callback => callback());
  pendingRequests = [];
};

const getNewToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const query = `
    mutation RefreshToken($refreshToken: String!) {
      refreshToken(refreshToken: $refreshToken) {
        token
        refreshToken
      }
    }
  `;

  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:11451/"}graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { refreshToken },
      }),
    });

    const { data, errors } = await response.json();

    if (errors || !data?.refreshToken) {
      throw new Error('Failed to refresh token');
    }

    const { token, refreshToken: newRefreshToken } = data.refreshToken;
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', newRefreshToken);
    
    return token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    throw error;
  }
};

// 错误处理链接
const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      // 检查是否是未授权错误 (UNAUTHENTICATED)
      // 后端返回的可能是 extensions.code = "UNAUTHENTICATED" 或者 message 包含 "Unauthorized"
      const isUnauthenticated = 
        err.extensions?.code === 'UNAUTHENTICATED' || 
        err.message.includes('未授权') ||
        err.message.includes('Unauthorized');

      if (isUnauthenticated) {
        if (!isRefreshing) {
          isRefreshing = true;
          return fromPromise(
            getNewToken()
              .then(() => {
                isRefreshing = false;
                resolvePendingRequests();
                return true;
              })
              .catch(() => {
                isRefreshing = false;
                pendingRequests = [];
                // 刷新失败，重定向到登录页或清理状态
                // window.location.href = '/login'; // 可以选择重定向
                return false;
              })
          ).flatMap(success => {
            if (success) {
              // 重试原来的请求
              const oldHeaders = operation.getContext().headers;
              operation.setContext({
                headers: {
                  ...oldHeaders,
                  authorization: `Bearer ${localStorage.getItem('token')}`,
                },
              });
              return forward(operation);
            } else {
              // 如果刷新失败，返回原来的错误
              return new Observable(observer => {
                observer.error(err);
                observer.complete();
              });
            }
          });
        } else {
          // 如果正在刷新，将请求加入队列
          return fromPromise(
            new Promise(resolve => {
              pendingRequests.push(() => resolve(true));
            })
          ).flatMap(() => {
             const oldHeaders = operation.getContext().headers;
              operation.setContext({
                headers: {
                  ...oldHeaders,
                  authorization: `Bearer ${localStorage.getItem('token')}`,
                },
              });
              return forward(operation);
          });
        }
      }
    }

    // 转换GraphQLFormattedError为GraphQLError格式
    const errors = graphQLErrors.map(error => ({
      ...error,
      nodes: [],
      source: undefined,
      positions: [],
      originalError: undefined,
      extensions: error.extensions || {}
    })) as any[]; // 使用 any 绕过类型检查，因为我们需要转换后的对象符合 errorHandler 的预期
    errorHandler.handleGraphQLErrors(errors);
  }

  if (networkError) {
    errorHandler.handleNetworkError(networkError);
  }
});

// 创建Apollo Client实例
const client = new ApolloClient({
  link: from([
    errorLink,
    authLink.concat(uploadLink),
  ]),
  cache: new InMemoryCache(cacheConfig),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
      notifyOnNetworkStatusChange: true,
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default client;
