import React, {useState} from "react";
import {useNavigate, Link} from "react-router-dom";
import {
    Card,
    Button,
    Input,
    Alert,
    Steps,
    Form,
    Typography,
    Divider
} from 'antd';
import {UserOutlined, LockOutlined, MailOutlined, SafetyOutlined} from '@ant-design/icons';
import {useAuth, useAppUser} from "../hooks";

const {Title, Text} = Typography;

export default function RegisterPage() {
    // GraphQL hooks
    const {register, sendVerificationCode, verifyEmail, loading} = useAuth();
    const {isAuthenticated} = useAppUser();
    const navigate = useNavigate();

    // 页面状态
    const [currentStep, setCurrentStep] = useState<'register' | 'verify'>('register');

    // 注册表单状态
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        inviteCode: ''
    });

    // 验证状态
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    // 如果已登录，重定向到博客主页
    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    // 表单验证
    const validateForm = () => {
        const {username, email, password, confirmPassword} = formData;

        if (!username.trim()) {
            setError('用户名不能为空');
            return false;
        }

        if (username.length < 3) {
            setError('用户名至少3个字符');
            return false;
        }

        if (!email.trim()) {
            setError('邮箱不能为空');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('请输入有效的邮箱地址');
            return false;
        }

        if (!password.trim()) {
            setError('密码不能为空');
            return false;
        }

        if (password.length < 8) {
            setError('密码至少8个字符');
            return false;
        }

        if (password !== confirmPassword) {
            setError('两次输入的密码不一致');
            return false;
        }

        return true;
    };

    // 处理注册
    const handleRegister = async () => {
        if (!validateForm()) {
            return;
        }

        setError(null);
        try {
            await register(
                formData.username,
                formData.email,
                formData.password,
                formData.inviteCode || undefined
            );

            // 注册成功，发送验证码
            await sendVerificationCode(formData.email, 'REGISTER');
            setCurrentStep('verify');
        } catch (err: any) {
            setError(err.message || '注册失败，请重试');
        }
    };

    // 处理邮箱验证
    const handleVerifyEmail = async () => {
        if (!verificationCode.trim()) {
            setError('请输入验证码');
            return;
        }

        setError(null);
        try {
            await verifyEmail(formData.email, verificationCode, 'REGISTER');
            // 验证成功，直接跳转到博客主页
            navigate('/', {
                state: {
                    message: '注册成功，欢迎来到博客！',
                    email: formData.email
                }
            });
        } catch (err: any) {
            setError(err.message || '验证码错误或已过期');
        }
    };

    // 重新发送验证码
    const handleResendCode = async () => {
        setError(null);
        try {
            await sendVerificationCode(formData.email, 'REGISTER');
        } catch (err: any) {
            setError(err.message || '发送验证码失败');
        }
    };

    // 处理表单输入
    const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }));
        // 清除错误
        if (error) setError(null);
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 relative"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e0e7ff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
            }}
        >
            {/* 背景模糊层 - 仅在未登录时显示 */}
            {!isAuthenticated && (
                <div
                    className="absolute inset-0 bg-white/10"
                    style={{
                        backdropFilter: 'blur(5px)',
                        WebkitBackdropFilter: 'blur(5px)',
                    }}
                />
            )}

            <div className="w-full max-w-md relative z-10">
                <Card
                    className="shadow-2xl border-0"
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        borderRadius: '16px',
                        maxWidth: '400px', // 限制最大宽度
                        margin: '0 auto', // 居中对齐
                    }}
                >
                    <div className="text-center mb-6">
                        <Title level={2} className="mb-0 text-gray-800">
                            {currentStep === 'register' ? '创建账户' : '邮箱验证'}
                        </Title>
                        <Text type="secondary" className="text-gray-600">
                            {currentStep === 'register' ? '加入我们的博客社区' : '验证您的邮箱地址'}
                        </Text>
                    </div>

                    {/* 步骤指示器 */}
                    <Steps
                        current={currentStep === 'register' ? 0 : 1}
                        className="mb-6"
                        size="small"
                        items={[
                            {
                                title: '填写信息',
                            },
                            {
                                title: '验证邮箱',
                            },
                            {
                                title: '完成注册',
                            },
                        ]}
                    />

                    {error && (
                        <Alert
                            message={error}
                            type="error"
                            showIcon
                            className="mb-4"
                            closable
                            onClose={() => setError(null)}
                        />
                    )}

                    {currentStep === 'register' ? (
                        // 注册表单
                        <Form onFinish={handleRegister} layout="vertical">
                            <Form.Item
                                label="用户名"
                                required
                            >
                                <Input
                                    prefix={<UserOutlined/>}
                                    placeholder="请输入用户名（3-20个字符）"
                                    value={formData.username}
                                    onChange={handleInputChange('username')}
                                    size="large"
                                    className="rounded-lg"
                                />
                            </Form.Item>

                            <Form.Item
                                label="邮箱"
                                required
                            >
                                <Input
                                    prefix={<MailOutlined/>}
                                    type="email"
                                    placeholder="请输入邮箱地址"
                                    value={formData.email}
                                    onChange={handleInputChange('email')}
                                    size="large"
                                    className="rounded-lg"
                                />
                            </Form.Item>

                            <Form.Item
                                label="密码"
                                required
                            >
                                <Input.Password
                                    prefix={<LockOutlined/>}
                                    placeholder="请输入密码（至少8个字符）"
                                    value={formData.password}
                                    onChange={handleInputChange('password')}
                                    size="large"
                                    className="rounded-lg"
                                />
                            </Form.Item>

                            <Form.Item
                                label="确认密码"
                                required
                            >
                                <Input.Password
                                    prefix={<LockOutlined/>}
                                    placeholder="请再次输入密码"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange('confirmPassword')}
                                    size="large"
                                    className="rounded-lg"
                                />
                            </Form.Item>

                            <Form.Item
                                label="邀请码（可选）"
                            >
                                <Input
                                    prefix={<SafetyOutlined/>}
                                    placeholder="如有邀请码请输入"
                                    value={formData.inviteCode}
                                    onChange={handleInputChange('inviteCode')}
                                    size="large"
                                    className="rounded-lg"
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading.register}
                                    size="large"
                                    block
                                    className="rounded-lg h-12 font-medium"
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                    }}
                                >
                                    {loading.register ? '注册中...' : '注册'}
                                </Button>
                            </Form.Item>
                        </Form>
                    ) : (
                        // 验证表单
                        <>
                            <Alert
                                message={`验证码已发送至 ${formData.email}，请检查邮箱`}
                                type="info"
                                showIcon
                                className="mb-4"
                            />

                            <Form onFinish={handleVerifyEmail} layout="vertical">
                                <Form.Item
                                    label="验证码"
                                    required
                                >
                                    <Input
                                        placeholder="请输入6位验证码"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        maxLength={6}
                                        size="large"
                                        className="rounded-lg text-center"
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading.verifyEmail}
                                        size="large"
                                        block
                                        className="rounded-lg h-12 font-medium"
                                        style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: 'none',
                                        }}
                                    >
                                        {loading.verifyEmail ? '验证中...' : '验证并完成注册'}
                                    </Button>
                                </Form.Item>
                            </Form>

                            <div className="flex justify-between mt-4">
                                <Button
                                    type="text"
                                    onClick={() => {
                                        setCurrentStep('register');
                                        setVerificationCode('');
                                        setError(null);
                                    }}
                                    className="text-gray-600"
                                >
                                    返回修改
                                </Button>
                                <Button
                                    type="text"
                                    loading={loading.sendCode}
                                    onClick={handleResendCode}
                                    className="text-blue-600"
                                >
                                    {loading.sendCode ? '发送中...' : '重新发送'}
                                </Button>
                            </div>
                        </>
                    )}

                    {/* 登录链接 */}
                    <Divider>或</Divider>
                    <div className="text-center">
                        <Text className="text-gray-600">已有账号？</Text>
                        <Link to="/login" className="text-blue-600 hover:text-blue-800 ml-1 transition-colors font-medium">
                            立即登录
                        </Link>
                    </div>
                </Card>

            </div>
        </div>
    );
}
