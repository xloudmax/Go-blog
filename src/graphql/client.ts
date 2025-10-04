import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { cacheConfig } from './cache-config';
import errorHandler from '@/services/errorHandler';

// 加载Apollo Client错误信息（开发环境）
if (import.meta.env.DEV || process.env.NODE_ENV !== "production") {
  loadDevMessages();
  loadErrorMessages();
}

// 创建HTTP链接
const httpLink = createHttpLink({
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

// 错误处理链接
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    // 转换GraphQLFormattedError为GraphQLError格式
    const errors = graphQLErrors.map(error => ({
      ...error,
      nodes: [],
      source: undefined,
      positions: [],
      originalError: undefined,
      extensions: error.extensions || {}
    })) as any[];
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
    authLink.concat(httpLink),
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
