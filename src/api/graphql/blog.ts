import {gql, useMutation, useQuery, useLazyQuery} from '@apollo/client';
import type {
    CreatePostInput,
    UpdatePostInput,
    PostFilterInput,
    PostSortInput,
    BlogPost,
} from '@/generated/graphql';

// ==================== QUERIES ====================

// 获取博客文章列表
export const POSTS_QUERY = gql`
  query Posts($limit: Int, $offset: Int, $filter: PostFilterInput, $sort: PostSortInput) {
    posts(limit: $limit, offset: $offset, filter: $filter, sort: $sort) {
      id
      title
      slug
      excerpt
      tags
      categories
      coverImageUrl
      status
      publishedAt
      lastEditedAt
      createdAt
      author {
        id
        username
        avatar
        role
      }
      stats {
        id
        viewCount
        likeCount
        shareCount
        commentCount
      }
    }
  }
`;

// 获取单个博客文章
export const POST_QUERY = gql`
  query Post($id: ID, $slug: String) {
    post(id: $id, slug: $slug) {
      id
      title
      slug
      excerpt
      content
      tags
      categories
      coverImageUrl
      accessLevel
      status
      publishedAt
      lastEditedAt
      createdAt
      updatedAt
      isLiked
      author {
        id
        username
        email
        avatar
        bio
        role
      }
      stats {
        id
        viewCount
        likeCount
        shareCount
        commentCount
        lastViewedAt
        updatedAt
      }
      versions {
        id
        versionNum
        title
        content
        changeLog
        createdAt
        createdBy {
          id
          username
          avatar
        }
      }
    }
  }
`;

// 获取文章版本历史
// 搜索文章
export const SEARCH_POSTS_QUERY = gql`
  query SearchPosts($query: String!, $limit: Int, $offset: Int) {
    searchPosts(query: $query, limit: $limit, offset: $offset) {
      posts {
        id
        title
        slug
        excerpt
        tags
        categories
        publishedAt
        author {
          id
          username
          avatar
        }
        stats {
          viewCount
          likeCount
        }
      }
      total
      took
    }
  }
`;

// 获取热门文章
export const POPULAR_POSTS_QUERY = gql`
  query PopularPosts($limit: Int) {
    getPopularPosts(limit: $limit) {
      id
      title
      slug
      excerpt
      publishedAt
      author {
        id
        username
        avatar
      }
      stats {
        viewCount
        likeCount
      }
    }
  }
`;

// 获取最新文章
export const RECENT_POSTS_QUERY = gql`
  query RecentPosts($limit: Int) {
    getRecentPosts(limit: $limit) {
      id
      title
      slug
      excerpt
      publishedAt
      author {
        id
        username
        avatar
      }
      stats {
        viewCount
        likeCount
      }
    }
  }
`;

// 获取热门标签
export const TRENDING_TAGS_QUERY = gql`
  query TrendingTags($limit: Int) {
    getTrendingTags(limit: $limit)
  }
`;

// ==================== MUTATIONS ====================

// 创建博客文章
export const CREATE_POST_MUTATION = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      title
      slug
      excerpt
      content
      tags
      categories
      coverImageUrl
      accessLevel
      status
      publishedAt
      createdAt
      author {
        id
        username
      }
    }
  }
`;

// 更新博客文章
export const UPDATE_POST_MUTATION = gql`
  mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) {
      id
      title
      slug
      excerpt
      content
      tags
      categories
      coverImageUrl
      accessLevel
      status
      lastEditedAt
      updatedAt
    }
  }
`;

// 删除博客文章
export const DELETE_POST_MUTATION = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      success
      message
      code
    }
  }
`;

// 发布文章
export const PUBLISH_POST_MUTATION = gql`
  mutation PublishPost($id: ID!) {
    publishPost(id: $id) {
      id
      status
      publishedAt
    }
  }
`;

// 归档文章
export const ARCHIVE_POST_MUTATION = gql`
  mutation ArchivePost($id: ID!) {
    archivePost(id: $id) {
      id
      status
    }
  }
`;

// 点赞文章
export const LIKE_POST_MUTATION = gql`
  mutation LikePost($id: ID!) {
    likePost(id: $id) {
      id
      stats {
        id
        likeCount
        viewCount
        shareCount
        commentCount
        updatedAt
      }
    }
  }
`;

// 取消点赞
export const UNLIKE_POST_MUTATION = gql`
  mutation UnlikePost($id: ID!) {
    unlikePost(id: $id) {
      id
      stats {
        id
        likeCount
        viewCount
        shareCount
        commentCount
        updatedAt
      }
    }
  }
`;

// ==================== CUSTOM HOOKS ====================

// 博客文章列表 Hook
export const usePosts = (filter?: PostFilterInput, sort?: PostSortInput, limit: number = 10, offset: number = 0) => {
    const {data, loading, error, fetchMore, refetch} = useQuery(POSTS_QUERY, {
        variables: {limit, offset, filter, sort},
        errorPolicy: 'all',
        notifyOnNetworkStatusChange: true,
    });

    const loadMore = () => {
        return fetchMore({
            variables: {
                offset: data?.posts?.length || 0,
            },
            updateQuery: (prev: { posts: BlogPost[] }, {fetchMoreResult}: {
                fetchMoreResult?: { posts: BlogPost[] }
            }) => {
                if (!fetchMoreResult) return prev;
                return {
                    ...prev,
                    posts: [...(prev.posts || []), ...(fetchMoreResult.posts || [])],
                };
            },
        });
    };

    return {
        posts: data?.posts || [],
        loading,
        error,
        loadMore,
        refetch,
    };
};

// 单个博客文章 Hook
// 文章版本历史 Hook
// 搜索文章 Hook
export const useSearchPosts = () => {
    const [searchPosts, {data, loading, error}] = useLazyQuery(SEARCH_POSTS_QUERY, {
        errorPolicy: 'all',
    });

    const search = (query: string, limit?: number, offset?: number) => {
        return searchPosts({
            variables: {query, limit, offset},
        });
    };

    return {
        search,
        results: data?.searchPosts || null,
        loading,
        error,
    };
};

// 热门文章 Hook
export const usePopularPosts = (limit: number = 10) => {
    const {data, loading, error} = useQuery(POPULAR_POSTS_QUERY, {
        variables: {limit},
        errorPolicy: 'all',
    });

    return {
        posts: data?.getPopularPosts || [],
        loading,
        error,
    };
};

// 最新文章 Hook
export const useRecentPosts = (limit: number = 10) => {
    const {data, loading, error} = useQuery(RECENT_POSTS_QUERY, {
        variables: {limit},
        errorPolicy: 'all',
    });

    return {
        posts: data?.getRecentPosts || [],
        loading,
        error,
    };
};

// 热门标签 Hook
export const useTrendingTags = (limit: number = 20) => {
    const {data, loading, error} = useQuery(TRENDING_TAGS_QUERY, {
        variables: {limit},
        errorPolicy: 'all',
    });

    return {
        tags: data?.getTrendingTags || [],
        loading,
        error,
    };
};

// 博客操作 Hook
export const useBlogActions = () => {
    // 创建文章
    const [createPostMutation, {loading: createLoading, error: createError}] = useMutation(CREATE_POST_MUTATION, {
        refetchQueries: [{query: POSTS_QUERY}],
        awaitRefetchQueries: true,
    });

    // 更新文章
    const [updatePostMutation, {loading: updateLoading, error: updateError}] = useMutation(UPDATE_POST_MUTATION);

    // 删除文章
    const [deletePostMutation, {loading: deleteLoading, error: deleteError}] = useMutation(DELETE_POST_MUTATION, {
        refetchQueries: [{query: POSTS_QUERY}],
        awaitRefetchQueries: true,
    });

    // 发布文章
    const [publishPostMutation, {loading: publishLoading}] = useMutation(PUBLISH_POST_MUTATION);

    // 归档文章
    const [archivePostMutation, {loading: archiveLoading}] = useMutation(ARCHIVE_POST_MUTATION);

    // 点赞文章
    const [likePostMutation, {loading: likeLoading}] = useMutation(LIKE_POST_MUTATION);

    // 取消点赞
    const [unlikePostMutation, {loading: unlikeLoading}] = useMutation(UNLIKE_POST_MUTATION);

    const createPost = async (postData: CreatePostInput) => {
        const result = await createPostMutation({
            variables: {input: postData},
        });
        return result.data?.createPost;
    };

    const updatePost = async (id: string, postData: UpdatePostInput) => {
        const result = await updatePostMutation({
            variables: {id, input: postData},
            update: (cache: any, {data}: { data?: { updatePost: BlogPost } }) => {
                if (data?.updatePost) {
                    cache.writeQuery({
                        query: POST_QUERY,
                        variables: {id},
                        data: {post: data.updatePost},
                    });
                }
            },
        });
        return result.data?.updatePost;
    };

    const deletePost = async (id: string) => {
        const result = await deletePostMutation({
            variables: {id},
            update: (cache: any) => {
                cache.evict({id: cache.identify({__typename: 'BlogPost', id})});
                cache.gc();
            },
        });
        return result.data?.deletePost;
    };

    const publishPost = async (id: string) => {
        const result = await publishPostMutation({
            variables: {id},
            update: (cache: any, {data}: { data?: { publishPost: BlogPost } }) => {
                if (data?.publishPost) {
                    cache.modify({
                        id: cache.identify({__typename: 'BlogPost', id}),
                        fields: {
                            status: () => data.publishPost.status,
                            publishedAt: () => data.publishPost.publishedAt,
                        },
                    });
                }
            },
        });
        return result.data?.publishPost;
    };

    const archivePost = async (id: string) => {
        const result = await archivePostMutation({
            variables: {id},
            update: (cache: any, {data}: { data?: { archivePost: BlogPost } }) => {
                if (data?.archivePost) {
                    cache.modify({
                        id: cache.identify({__typename: 'BlogPost', id}),
                        fields: {
                            status: () => data.archivePost.status,
                        },
                    });
                }
            },
        });
        return result.data?.archivePost;
    };

    const likePost = async (id: string) => {
        const result = await likePostMutation({
            variables: {id},
            optimisticResponse: {
                likePost: {
                    __typename: 'BlogPost',
                    id,
                    stats: {
                        __typename: 'BlogPostStats',
                        id: `stats-${id}`,
                        likeCount: 0, // 这会被实际结果覆盖
                        viewCount: 0,
                        shareCount: 0,
                        commentCount: 0,
                        updatedAt: new Date().toISOString(),
                    },
                },
            },
        });
        return result.data?.likePost;
    };

    const unlikePost = async (id: string) => {
        const result = await unlikePostMutation({
            variables: {id},
            optimisticResponse: {
                unlikePost: {
                    __typename: 'BlogPost',
                    id,
                    stats: {
                        __typename: 'BlogPostStats',
                        id: `stats-${id}`,
                        likeCount: 0, // 这会被实际结果覆盖
                        viewCount: 0,
                        shareCount: 0,
                        commentCount: 0,
                        updatedAt: new Date().toISOString(),
                    },
                },
            },
        });
        return result.data?.unlikePost;
    };

    return {
        // API 函数
        createPost,
        updatePost,
        deletePost,
        publishPost,
        archivePost,
        likePost,
        unlikePost,

        // 加载状态
        loading: {
            create: createLoading,
            update: updateLoading,
            delete: deleteLoading,
            publish: publishLoading,
            archive: archiveLoading,
            like: likeLoading,
            unlike: unlikeLoading,
        },

        // 错误状态
        errors: {
            create: createError,
            update: updateError,
            delete: deleteError,
        },
    };
};