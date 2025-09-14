import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ArticleCard from '@/components/ArticleCard';

// Mock Ant Design components
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Card: ({ children, cover }: any) => (
      <div data-testid="card">
        {cover && <div data-testid="card-cover">{cover}</div>}
        <div data-testid="card-content">{children}</div>
      </div>
    ),
    Typography: {
      Title: ({ children, level }: any) => {
        const Heading = `h${level}` as keyof JSX.IntrinsicElements;
        return <Heading>{children}</Heading>;
      },
      Paragraph: ({ children }: any) => <p>{children}</p>,
    },
    Space: ({ children }: any) => <div>{children}</div>,
    Avatar: ({ children }: any) => <div data-testid="avatar">{children}</div>,
    Tag: ({ children }: any) => <span data-testid="tag">{children}</span>,
    Dropdown: ({ children }: any) => <div>{children}</div>,
    Button: ({ children, onClick }: any) => (
      <button onClick={onClick} data-testid="button">
        {children}
      </button>
    ),
  };
});

// Mock hooks
vi.mock('@/hooks', () => ({
  useAppUser: () => ({
    user: { username: 'testuser' },
    isAuthenticated: true,
  }),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('ArticleCard', () => {
  const mockPost = {
    id: '1',
    title: 'Test Article',
    slug: 'test-article',
    content: 'Test content',
    excerpt: 'Test excerpt',
    tags: ['tag1', 'tag2'],
    author: {
      username: 'testuser',
      avatar: null,
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
  };

  const mockOnNavigate = vi.fn();
  const mockOnAction = vi.fn();

  it('renders correctly with all props', () => {
    render(
      <BrowserRouter>
        <ArticleCard 
          post={mockPost} 
          onNavigate={mockOnNavigate} 
          onAction={mockOnAction} 
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Article')).toBeInTheDocument();
    expect(screen.getByText('Test excerpt')).toBeInTheDocument();
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('renders without excerpt', () => {
    const postWithoutExcerpt = { ...mockPost, excerpt: undefined };
    
    render(
      <BrowserRouter>
        <ArticleCard 
          post={postWithoutExcerpt} 
          onNavigate={mockOnNavigate} 
          onAction={mockOnAction} 
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Article')).toBeInTheDocument();
    expect(screen.queryByText('Test excerpt')).not.toBeInTheDocument();
  });

  it('renders without tags', () => {
    const postWithoutTags = { ...mockPost, tags: [] };
    
    render(
      <BrowserRouter>
        <ArticleCard 
          post={postWithoutTags} 
          onNavigate={mockOnNavigate} 
          onAction={mockOnAction} 
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Article')).toBeInTheDocument();
    expect(screen.queryByTestId('tag')).not.toBeInTheDocument();
  });
});