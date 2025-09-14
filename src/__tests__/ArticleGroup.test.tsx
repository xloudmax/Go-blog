import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ArticleListContainer from '@/components/ArticleListContainer';

// Mock Ant Design components
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Typography: {
      Title: ({ children }: any) => <h3>{children}</h3>,
      Text: ({ children }: any) => <span>{children}</span>,
    },
    Button: ({ children, onClick }: any) => (
      <button onClick={onClick} data-testid="button">
        {children}
      </button>
    ),
    Alert: ({ message, description }: any) => (
      <div data-testid="alert">
        <span>{message}</span>
        <span>{description}</span>
      </div>
    ),
  };
});

// Mock ArticleCard component
vi.mock('@/components/ArticleCard', () => ({
  default: ({ post }: any) => (
    <div data-testid="article-card">
      <h3>{post.title}</h3>
    </div>
  ),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('ArticleListContainer', () => {
  const mockPosts = [
    {
      id: '1',
      title: 'Test Article 1',
      slug: 'test-article-1',
      content: 'Test content 1',
      author: {
        username: 'testuser',
      },
      stats: {
        viewCount: 100,
      },
      createdAt: '2023-01-01T00:00:00Z',
      publishedAt: '2023-01-01T00:00:00Z',
      status: 'PUBLISHED',
      accessLevel: 'PUBLIC',
      categories: [],
      isLiked: false,
      lastEditedAt: null,
      updatedAt: '2023-01-01T00:00:00Z',
      versions: [],
      coverImageUrl: null,
    },
    {
      id: '2',
      title: 'Test Article 2',
      slug: 'test-article-2',
      content: 'Test content 2',
      author: {
        username: 'testuser',
      },
      stats: {
        viewCount: 50,
      },
      createdAt: '2023-01-02T00:00:00Z',
      publishedAt: '2023-01-02T00:00:00Z',
      status: 'PUBLISHED',
      accessLevel: 'PUBLIC',
      categories: [],
      isLiked: false,
      lastEditedAt: null,
      updatedAt: '2023-01-02T00:00:00Z',
      versions: [],
      coverImageUrl: null,
    },
  ];

  const mockOnAction = vi.fn();

  it('renders correctly with posts', () => {
    render(
      <BrowserRouter>
        <ArticleListContainer
          posts={mockPosts}
          loading={false}
          error={null}
          onAction={mockOnAction}
        />
      </BrowserRouter>
    );

    expect(screen.getAllByTestId('article-card')).toHaveLength(2);
  });

  it('renders loading state', () => {
    render(
      <BrowserRouter>
        <ArticleListContainer
          posts={[]}
          loading={true}
          error={null}
          onAction={mockOnAction}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const error = new Error('Test error');
    render(
      <BrowserRouter>
        <ArticleListContainer
          posts={[]}
          loading={false}
          error={error}
          onAction={mockOnAction}
        />
      </BrowserRouter>
    );

    expect(screen.getByTestId('alert')).toBeInTheDocument();
    expect(screen.getByText('加载失败')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <BrowserRouter>
        <ArticleListContainer
          posts={[]}
          loading={false}
          error={null}
          onAction={mockOnAction}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('还没有文章')).toBeInTheDocument();
  });
});