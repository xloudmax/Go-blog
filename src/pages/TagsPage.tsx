import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Card, Tag, Empty, Spin, Input, Space, Typography } from 'antd';
import { SearchOutlined, TagOutlined, FolderOutlined } from '@ant-design/icons';
import { useGetTagsQuery, useGetCategoriesQuery } from '@/generated/graphql';

const { Title, Text } = Typography;

export default function TagsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('tags');
  const [searchText, setSearchText] = useState<string>('');

  // 获取标签数据
  const { data: tagsData, loading: tagsLoading } = useGetTagsQuery({
    variables: { limit: 100, search: searchText || undefined },
  });

  // 获取分类数据
  const { data: categoriesData, loading: categoriesLoading } = useGetCategoriesQuery({
    variables: { limit: 100, search: searchText || undefined },
  });

  const tags = tagsData?.getTags || [];
  const categories = categoriesData?.getCategories || [];

  // 处理标签点击
  const handleTagClick = (name: string) => {
    navigate(`/search?tag=${encodeURIComponent(name)}`);
  };

  // 处理分类点击
  const handleCategoryClick = (name: string) => {
    navigate(`/search?category=${encodeURIComponent(name)}`);
  };

  // 渲染标签列表
  const renderTags = () => {
    if (tagsLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (tags.length === 0) {
      return (
        <Empty
          description={searchText ? '没有找到匹配的标签' : '暂无标签'}
          style={{ padding: '3rem' }}
        />
      );
    }

    return (
      <div style={{ padding: '1.5rem' }}>
        <Space size={[16, 16]} wrap>
          {tags.map((tag) => (
            <Tag
              key={tag.name}
              onClick={() => handleTagClick(tag.name)}
              style={{
                fontSize: '16px',
                padding: '8px 16px',
                cursor: 'pointer',
                borderRadius: '6px',
                transition: 'all 0.3s',
              }}
              className="tag-item"
            >
              <TagOutlined style={{ marginRight: '8px' }} />
              {tag.name}
              <span
                style={{
                  marginLeft: '8px',
                  opacity: 0.6,
                  fontSize: '14px',
                }}
              >
                ({tag.count})
              </span>
            </Tag>
          ))}
        </Space>
      </div>
    );
  };

  // 渲染分类列表
  const renderCategories = () => {
    if (categoriesLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (categories.length === 0) {
      return (
        <Empty
          description={searchText ? '没有找到匹配的分类' : '暂无分类'}
          style={{ padding: '3rem' }}
        />
      );
    }

    return (
      <div style={{ padding: '1.5rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}
        >
          {categories.map((category) => (
            <Card
              key={category.name}
              hoverable
              onClick={() => handleCategoryClick(category.name)}
              style={{
                borderRadius: '8px',
                cursor: 'pointer',
              }}
              bodyStyle={{ padding: '1.5rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FolderOutlined style={{ fontSize: '24px', color: 'var(--color-primary)' }} />
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: '16px', display: 'block' }}>
                    {category.name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    {category.count} 篇文章
                  </Text>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: '2rem' }}>
        <Title level={2} style={{ marginBottom: '0.5rem' }}>
          标签与分类
        </Title>
        <Text type="secondary">浏览所有标签和分类，发现感兴趣的内容</Text>
      </div>

      {/* 搜索框 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Input
          placeholder={activeTab === 'tags' ? '搜索标签...' : '搜索分类...'}
          prefix={<SearchOutlined />}
          size="large"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ maxWidth: '500px' }}
        />
      </div>

      {/* 标签和分类标签页 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'tags',
            label: (
              <span>
                <TagOutlined /> 标签 ({tags.length})
              </span>
            ),
            children: renderTags(),
          },
          {
            key: 'categories',
            label: (
              <span>
                <FolderOutlined /> 分类 ({categories.length})
              </span>
            ),
            children: renderCategories(),
          },
        ]}
      />

      {/* 自定义样式 */}
      <style>{`
        .tag-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}
