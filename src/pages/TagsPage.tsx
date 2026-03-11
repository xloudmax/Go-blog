import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Card, Tag, Empty, Spin, Space, Typography, Grid } from 'antd';
import { TagOutlined, FolderOutlined } from '@ant-design/icons';
import { useGetTagsQuery, useGetCategoriesQuery } from '@/generated/graphql';
import { LiquidSearchBox } from '@/components/LiquidSearchBox';
import { PageHeader } from '@/components/PageHeader';
import { PageContainer } from '@/components/PageContainer';

const { Text } = Typography;
const { useBreakpoint } = Grid;

export default function TagsPage() {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
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
        <div style={{ textAlign: 'center', padding: isMobile ? '1.5rem' : '3rem' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (tags.length === 0) {
      return (
        <Empty
          description={searchText ? '没有找到匹配的标签' : '暂无标签'}
          style={{ padding: isMobile ? '1.5rem' : '3rem' }}
        />
      );
    }

    return (
      <div style={{ padding: isMobile ? '0.5rem' : '1.5rem' }}>
        <Space size={isMobile ? [8, 8] : [16, 16]} wrap>
          {tags.map((tag) => (
            <Tag
              key={tag.name}
              onClick={() => handleTagClick(tag.name)}
              style={{
                fontSize: isMobile ? '14px' : '16px',
                padding: isMobile ? '4px 12px' : '8px 16px',
                cursor: 'pointer',
                borderRadius: '6px',
                transition: 'all 0.3s',
                marginRight: 0,
                display: 'inline-flex',
                alignItems: 'center'
              }}
              className="tag-item"
            >
              <TagOutlined style={{ marginRight: '8px' }} />
              {tag.name}
              <span
                style={{
                  marginLeft: '8px',
                  opacity: 0.6,
                  fontSize: isMobile ? '12px' : '14px',
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
        <div style={{ textAlign: 'center', padding: isMobile ? '1.5rem' : '3rem' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (categories.length === 0) {
      return (
        <Empty
          description={searchText ? '没有找到匹配的分类' : '暂无分类'}
          style={{ padding: isMobile ? '1.5rem' : '3rem' }}
        />
      );
    }

    return (
      <div style={{ padding: isMobile ? '0.5rem' : '1.5rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: isMobile ? '0.75rem' : '1rem',
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
              styles={{ body: { padding: isMobile ? '1rem' : '1.5rem' } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FolderOutlined style={{ fontSize: isMobile ? '20px' : '24px', color: 'var(--color-primary)' }} />
                <div style={{ flex: 1 }}>
                  <Text strong style={{ fontSize: isMobile ? '15px' : '16px', display: 'block' }}>
                    {category.name}
                  </Text>
                  <Text type="secondary" style={{ fontSize: isMobile ? '13px' : '14px' }}>
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
    <PageContainer>
      <PageHeader
        title="标签与分类"
        icon={<TagOutlined />}
      />

      {/* 搜索框 */}
      <div style={{ 
        marginBottom: isMobile ? '1rem' : '1.5rem',
        padding: isMobile ? '0 0.5rem' : 0
      }}>
        <LiquidSearchBox
          placeholder={activeTab === 'tags' ? '搜索标签...' : '搜索分类...'}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          blur={0}
          width={isMobile ? '100%' : 500}
          height={isMobile ? 44 : 50}
          bezelWidth={isMobile ? 10 : 15}
          scale={isMobile ? 15 : 20}
          inputClassName={isMobile ? "text-base" : ""}
        />
      </div>

      {/* 标签和分类标签页 */}
      <div style={{ padding: isMobile ? '0' : '0' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered={isMobile}
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
      </div>

      {/* 自定义样式 */}
      <style>{`
        .tag-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .ant-tabs-nav {
          margin-bottom: ${isMobile ? '8px' : '16px'} !important;
        }
      `}</style>
    </PageContainer>
  );
}
