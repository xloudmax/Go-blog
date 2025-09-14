import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchAndFilter from '@/components/SearchAndFilter';

// Mock Ant Design components
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Input: {
      Search: ({ placeholder, onSearch }: any) => (
        <input 
          placeholder={placeholder} 
          onChange={(e) => onSearch && onSearch(e.target.value)}
          data-testid="search-input"
        />
      ),
    },
    Select: ({ children, placeholder }: any) => (
      <select placeholder={placeholder} data-testid="select">
        {children}
      </select>
    ),
    Option: ({ children }: any) => <option>{children}</option>,
    Button: ({ children, onClick }: any) => (
      <button onClick={onClick} data-testid="button">
        {children}
      </button>
    ),
    Space: ({ children }: any) => <div>{children}</div>,
    Tag: ({ children }: any) => <span>{children}</span>,
  };
});

describe('SearchAndFilter', () => {
  const mockOnSearch = vi.fn();
  const mockOnFilter = vi.fn();
  const mockOnClearFilters = vi.fn();
  const mockAllTags = ['tag1', 'tag2', 'tag3'];

  const defaultProps = {
    onSearch: mockOnSearch,
    onFilter: mockOnFilter,
    activeFilters: {},
    onClearFilters: mockOnClearFilters,
    allTags: mockAllTags,
  };

  it('renders correctly', () => {
    render(<SearchAndFilter {...defaultProps} />);

    expect(screen.getByPlaceholderText('搜索文章标题、内容或标签')).toBeInTheDocument();
    expect(screen.getByText('筛选:')).toBeInTheDocument();
  });

  it('renders tag options', () => {
    render(<SearchAndFilter {...defaultProps} />);

    // Check if tags are rendered in the select dropdown
    expect(screen.getByTestId('select')).toBeInTheDocument();
  });

  it('renders status options', () => {
    render(<SearchAndFilter {...defaultProps} />);

    // Check if status options are available
    const selectElements = screen.getAllByTestId('select');
    expect(selectElements).toHaveLength(2); // Tags select and status select
  });
});