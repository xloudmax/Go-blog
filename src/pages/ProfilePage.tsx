import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Divider,
  Typography,
  Space,
  Row,
  Col,
  Spin
} from 'antd';
import {
  SaveOutlined,
  EditOutlined
} from '@ant-design/icons';

import { useAppUser } from '@/hooks/appStateHooks';
import { useUpdateProfileMutation } from '@/generated/graphql';
import type { UpdateProfileInput } from '@/generated/graphql';
import AvatarUpload from '@/components/AvatarUpload';


const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAppUser();
  const [form] = Form.useForm();
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar || undefined);

  const [updateProfile, { loading: updateLoading }] = useUpdateProfileMutation({
    onCompleted: () => {
      message.success('个人资料更新成功！');
      refreshUser();
    },
    onError: (error) => {
      message.error(`更新失败: ${error.message}`);
    }
  });

  // 处理头像上传成功
  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url);
    message.success('头像上传成功！');
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
                <AvatarUpload
                  value={avatarUrl}
                  onChange={handleAvatarChange}
                  size={120}
                  showUploadButton={true}
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
