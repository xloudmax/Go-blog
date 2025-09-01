import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Spin, 
  Modal, 
  Input, 
  Card, 
  Row, 
  Col, 
  Typography, 
  message 
} from 'antd';
import { PlusOutlined, FolderOutlined } from '@ant-design/icons';
import { useFileManager } from '@/hooks';
import { useAppUser } from '@/hooks';

const { Title, Text } = Typography;

export default function FoldersPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppUser();
  
  const {
    folders,
    loading,
    createFolder
  } = useFileManager();

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName.trim());
      setNewFolderName('');
      setShowCreateFolder(false);
      message.success('文件夹创建成功');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '创建文件夹失败';
      message.error(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow">
          <Title level={3}>需要登录</Title>
          <Text className="py-6 block">请先登录以访问文件管理功能</Text>
          <Button type="primary" onClick={() => navigate('/login')}>
            去登录
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center">
        <Title level={2} className="mb-0">文件管理</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setShowCreateFolder(true)}
        >
          创建文件夹
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-6">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {folders.map((folder: { name: string; fileCount: number; createdAt: string }) => (
            <Col xs={12} sm={8} md={6} key={folder.name}>
              <Card
                hoverable
                onClick={() => navigate(`/editor?folder=${folder.name}`)}
                cover={<div className="text-4xl text-center py-4"><FolderOutlined /></div>}
              >
                <Card.Meta
                  title={<Text strong>{folder.name}</Text>}
                  description={
                    <>
                      <div>{folder.fileCount} 个文件</div>
                      <Text type="secondary" className="text-xs">
                        {formatDate(folder.createdAt)}
                      </Text>
                    </>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="创建新文件夹"
        open={showCreateFolder}
        onCancel={() => setShowCreateFolder(false)}
        onOk={handleCreateFolder}
        okText="创建"
        cancelText="取消"
        okButtonProps={{ disabled: !newFolderName.trim() }}
      >
        <Input
          placeholder="文件夹名称"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onPressEnter={handleCreateFolder}
        />
      </Modal>
    </div>
  );
}