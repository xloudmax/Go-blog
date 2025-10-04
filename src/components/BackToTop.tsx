import { useState, useEffect } from 'react';
import { Button, Tooltip } from 'antd';
import { VerticalAlignTopOutlined } from '@ant-design/icons';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // 监听滚动，决定是否显示按钮
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  // 滚动到顶部
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Tooltip title="返回顶部" placement="left">
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={<VerticalAlignTopOutlined />}
        onClick={scrollToTop}
        style={{
          position: 'fixed',
          bottom: '40px',
          right: '40px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      />
    </Tooltip>
  );
}
