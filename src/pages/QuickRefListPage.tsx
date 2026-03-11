import React, { useState, useEffect } from 'react';
import { Card, Input, Typography, Row, Col, Spin, Empty } from 'antd';
import { SearchOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@/components/PageContainer';
import { motion } from 'framer-motion';
import { useBlogList } from '@/hooks';

const { Title, Text } = Typography;

export default function QuickRefListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  const { posts, loading, filterByTags, filterBySearch } = useBlogList();

  // Initialize filter to only show QuickRef tags
  useEffect(() => {
    filterByTags(['QuickRef']);
  }, [filterByTags]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    filterBySearch(val);
  };

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center mb-12">
          <Title level={1} className="!mb-4 !text-white flex items-center justify-center gap-3">
            <BookOutlined /> 知识卡片 (Quick Reference)
          </Title>
          <Text className="text-gray-400 text-lg">
            开发速查表，记录常用代码与命令。
          </Text>
          <div className="max-w-xl mx-auto mt-8">
            <Input
              size="large"
              placeholder="搜索速查表 (如: react, docker, git...)"
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchTerm}
              onChange={handleSearch}
              className="rounded-2xl shadow-lg border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 focus:bg-white/20 placeholder:text-gray-400"
              style={{ padding: '12px 24px' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spin size="large" /></div>
        ) : posts.length === 0 ? (
          <Empty description="暂无速查表数据" className="py-20" />
        ) : (
          <Row gutter={[16, 16]}>
            {posts.map((post, index) => (
              <Col xs={12} sm={8} md={6} lg={4} key={post.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (index % 20) * 0.02, duration: 0.3 }}
                  whileHover={{ y: -5, scale: 1.05 }}
                  onClick={() => navigate(`/post/${post.slug}`)}
                >
                  <Card 
                    variant="borderless"
                    className="cursor-pointer h-full bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all backdrop-blur-md"
                    styles={{ body: { padding: '20px', textAlign: 'center' } }}
                  >
                    <Text className="text-white font-medium text-lg capitalize block truncate">
                      {post.title}
                    </Text>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </PageContainer>
  );
}
