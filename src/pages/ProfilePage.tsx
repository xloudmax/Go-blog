import React, { useState, useRef } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  message,
  Divider,
  Typography,
  Space,
  Row,
  Col,
  Spin,
  Alert,
  Modal
} from 'antd';
import {
  UserOutlined,
  CameraOutlined,
  SaveOutlined,
  EditOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd';
import { useAppUser } from '@/hooks/appStateHooks';
import { useUpdateProfileMutation } from '@/generated/graphql';
import type { UpdateProfileInput } from '@/generated/graphql';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

interface ProfilePageProps {}

const ProfilePage: React.FC<ProfilePageProps> = () => {
  const { user, isAuthenticated, refreshUser } = useAppUser();
  const [form] = Form.useForm();
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar || undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [updateProfile, { loading: updateLoading }] = useUpdateProfileMutation({
    onCompleted: (data) => {
      message.success('个人资料更新成功！');
      refreshUser();
    },
    onError: (error) => {
      console.error('更新个人资料失败:', error);
      message.error(`更新失败: ${error.message}`);
    }
  });

  // 验证文件类型和大小
  const validateFile = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      message.error('只支持 JPEG、PNG、GIF 和 WebP 格式的图片！');
      return false;
    }

    if (file.size > maxSize) {
      message.error('图片大小不能超过 5MB！');
      return false;
    }

    return true;
  };

  // 处理头像上传
  const handleAvatarUpload = async (file: File) => {
    if (!validateFile(file)) {
      return;
    }

    setAvatarLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      // 上传到服务器
      const response = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`上传失败: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setAvatarUrl(result.url);
        message.success('头像上传成功！');
      } else {
        throw new Error(result.message || '上传失败');
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      message.error(error instanceof Error ? error.message : '头像上传失败，请重试');
    } finally {
      setAvatarLoading(false);
    }
  };

  // 处理文件选择
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleAvatarUpload(file);
    }
  };

  // 触发文件选择
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // 提交表单
  const handleSubmit = async (values: any) => {
    try {
      const input: UpdateProfileInput = {
        username: values.username !== user?.username ? values.username : undefined,
        bio: values.bio !== user?.bio ? values.bio : undefined,
        avatar: avatarUrl !== user?.avatar ? avatarUrl : undefined,
      };

      // 过滤掉 undefined 值
      const filteredInput = Object.fromEntries(
        Object.entries(input).filter(([_, value]) => value !== undefined)
      );

      if (Object.keys(filteredInput).length === 0) {
        message.info('没有检测到任何更改');
        return;
      }

      await updateProfile({
        variables: { input: filteredInput }
      });
    } catch (error) {
      console.error('更新个人资料失败:', error);
      message.error('更新失败，请重试');
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900" style={{ padding: '0 40px', boxSizing: 'border-box' }}>
      <div className="max-w-7xl mx-auto py-12">
        {/* 页面标题在容器外 */}
        <div className="mb-8">
          <Title level={2} className="mb-4 text-gray-900 dark:text-gray-100">
            个人资料
          </Title>
          <Paragraph type="secondary" className="mb-0">
            管理您的个人信息和偏好设置
          </Paragraph>
        </div>
        
        {/* 内容容器 */}
        <Card className="mx-8">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            username: user.username,
            email: user.email,
            bio: user.bio || '',
          }}
          onFinish={handleSubmit}
        >
          <Row gutter={[24, 24]}>
            {/* 左侧：基本信息 */}
            <Col xs={24} md={16}>
              <Title level={4}>
                <EditOutlined /> 基本信息
              </Title>
              
              <Form.Item
                label="用户名"
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                  { max: 50, message: '用户名最多50个字符' },
                  {
                    pattern: /^[a-zA-Z0-9_-]+$/,
                    message: '用户名只能包含字母、数字、下划线和连字符'
                  }
                ]}
              >
                <Input
                  placeholder="请输入用户名"
                  maxLength={50}
                />
              </Form.Item>

              <Form.Item label="邮箱" name="email">
                <Input
                  disabled
                  placeholder="邮箱地址"
                  suffix={
                    user.isVerified ? (
                      <span className="text-green-500 text-xs">已验证</span>
                    ) : (
                      <span className="text-orange-500 text-xs">未验证</span>
                    )
                  }
                />
              </Form.Item>

              <Form.Item
                label="个人简介"
                name="bio"
                rules={[
                  { max: 500, message: '个人简介最多500个字符' }
                ]}
              >
                <TextArea
                  placeholder="介绍一下您自己..."
                  rows={4}
                  maxLength={500}
                  showCount
                />
              </Form.Item>
            </Col>

            {/* 右侧：头像 */}
            <Col xs={24} md={8}>
              <Title level={4}>头像设置</Title>
              
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <Avatar
                    size={120}
                    src={avatarUrl}
                    icon={<UserOutlined />}
                    className="border-2 border-gray-300"
                  />
                  
                  {/* 上传按钮覆盖层 */}
                  <Button
                    type="primary"
                    shape="circle"
                    icon={avatarLoading ? <LoadingOutlined /> : <CameraOutlined />}
                    size="small"
                    onClick={triggerFileSelect}
                    loading={avatarLoading}
                    className="absolute bottom-0 right-0"
                  />
                </div>

                <div className="text-center text-gray-500 text-sm">
                  <p>支持 JPG、PNG、GIF、WebP 格式</p>
                  <p>文件大小不超过 5MB</p>
                </div>

                {/* 隐藏的文件输入 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            </Col>
          </Row>

          <Divider />

          {/* 账户信息（只读） */}
          <Title level={4}>账户信息</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div className="text-sm">
                <span className="text-gray-500">用户角色：</span>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {user.role === 'ADMIN' ? '管理员' : '用户'}
                </span>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="text-sm">
                <span className="text-gray-500">注册时间：</span>
                <span className="ml-2">
                  {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="text-sm">
                <span className="text-gray-500">最后登录：</span>
                <span className="ml-2">
                  {user.lastLoginAt 
                    ? new Date(user.lastLoginAt).toLocaleString('zh-CN')
                    : '从未登录'
                  }
                </span>
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="text-sm">
                <span className="text-gray-500">账户状态：</span>
                <span className="ml-2">
                  {user.isActive ? (
                    <span className="text-green-600">活跃</span>
                  ) : (
                    <span className="text-red-600">已停用</span>
                  )}
                </span>
              </div>
            </Col>
          </Row>

          <Divider />

          {/* 提交按钮 */}
          <div className="text-center">
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateLoading}
                icon={<SaveOutlined />}
                size="large"
              >
                保存更改
              </Button>
              <Button
                onClick={() => form.resetFields()}
                size="large"
              >
                重置
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
      </div>
    </div>
  );
};

export default ProfilePage;