import React from 'react';
import { Spin } from 'antd';

const PageLoading: React.FC = () => (
  <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
    <Spin size="large" tip="页面加载中..." />
  </div>
);

export default PageLoading;
