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

// 加载Apollo Client错误信息（开发环境）
if (import.meta.env.DEV || process.env.NODE_ENV !== "production") {
  loadDevMessages();
  loadErrorMessages();
}

// 创建HTTP链接
const httpLink = createHttpLink({
  uri: `${import.meta.env.VITE_API_BASE_URL || "http://0.0.0.0:11451/"}graphql`,
});

// 认证链接 - 自动添加JWT token到请求头
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token && token !== 'undefined' ? `Bearer ${token}` : "",
    }
  };
});

// 错误处理链接
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );

      // 处理认证错误
      if (extensions?.code === 'UNAUTHENTICATED' || extensions?.code === 'FORBIDDEN') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);

    // 处理401未认证错误
    if ('statusCode' in networkError && networkError.statusCode === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
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
