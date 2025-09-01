import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
    Card, 
    Button, 
    Input, 
    Checkbox, 
    Alert, 
    Tabs, 
    Form, 
    Typography, 
    Divider
} from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useAuth, useAppUser, useAppUI } from "../hooks";

const { Title, Text } = Typography;

// 登录表单验证
const validateLoginForm = (identifier: string, password: string) => {
  const errors = [];

  if (!identifier || identifier.trim().length === 0) {
    errors.push('用户名/邮箱不能为空');
  }

  if (!password || password.length < 6) {
    errors.push('密码长度不能少于6位');
  }

  return errors;
};

// 邮箱格式验证
const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export default function LoginPage() {
    // GraphQL hooks
    const { login, emailLogin, verifyEmailAndLogin, sendVerificationCode, loading } = useAuth();
    const { isAuthenticated } = useAppUser();
    const { error: globalError, clearError } = useAppUI();
    const navigate = useNavigate();

    // 表单状态
    const [loginMode, setLoginMode] = useState<'password' | 'email'>('password');
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [showVerification, setShowVerification] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 如果已登录，重定向到博客主页
    React.useEffect(() => {
        if (isAuthenticated) {
            // 检查是否有登录后重定向的页面
            const redirectPath = localStorage.getItem('redirectAfterLogin');
            if (redirectPath) {
                localStorage.removeItem('redirectAfterLogin');
                navigate(redirectPath);
            } else {
                navigate('/');
            }
        }
    }, [isAuthenticated, navigate]);

    // 处理全局错误
    useEffect(() => {
        if (globalError) {
            setError(globalError);
            // 清除全局错误，避免重复显示
            clearError();
        }
    }, [globalError, clearError]);

    // 密码登录
    const handlePasswordLogin = async () => {
        // 前端验证
        const validationErrors = validateLoginForm(identifier, password);
        if (validationErrors.length > 0) {
            setError(validationErrors.join(', '));
            return;
        }

        setError(null);
        try {
            const result = await login(identifier, password, remember);
            // 只有登录成功时才跳转
            if (result) {
                // 登录成功后跳转到博客主页
                const redirectPath = localStorage.getItem('redirectAfterLogin');
                if (redirectPath) {
                    localStorage.removeItem('redirectAfterLogin');
                    navigate(redirectPath);
                } else {
                    navigate("/");
                }
            }
        } catch (err: any) {
            // 处理登录错误
            if (err.message && err.message.includes('用户名或密码错误')) {
                setError('用户名或密码错误，请检查后重试');
            } else {
                setError(err.message || '登录失败，请稍后重试');
            }
        }
    };

    // 邮箱登录（发送验证码）
    const handleEmailLogin = async () => {
        if (!identifier) {
            setError("请输入邮箱地址");
            return;
        }

        // 邮箱格式验证
        if (!validateEmail(identifier)) {
            setError("请输入有效的邮箱地址");
            return;
        }

        setError(null);
        try {
            await emailLogin(identifier);
            setShowVerification(true);
        } catch (err: any) {
            setError(err.message || "发送验证码失败，请重试");
        }
    };

    // 验证码登录
    const handleVerificationLogin = async () => {
        if (!verificationCode) {
            setError("请输入验证码");
            return;
        }

        setError(null);
        try {
            const result = await verifyEmailAndLogin(identifier, verificationCode, 'LOGIN');
            // 只有验证成功时才跳转
            if (result) {
                // 登录成功后跳转到博客主页
                const redirectPath = localStorage.getItem('redirectAfterLogin');
                if (redirectPath) {
                    localStorage.removeItem('redirectAfterLogin');
                    navigate(redirectPath);
                } else {
                    navigate("/");
                }
            }
        } catch (err: any) {
            setError(err.message || "验证码错误，请重试");
        }
    };

    // 重新发送验证码
    const handleResendCode = async () => {
        try {
            await sendVerificationCode(identifier, 'LOGIN');
        } catch (err: any) {
            setError(err.message || "发送验证码失败");
        }
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
                        <Title level={2} className="mb-0 text-gray-800">欢迎回来</Title>
                        <Text type="secondary" className="text-gray-600">请登录您的账户</Text>
                    </div>

                    {/* 登录模式切换 */}
                    {!showVerification && (
                        <Tabs
                            activeKey={loginMode}
                            onChange={(key) => setLoginMode(key as 'password' | 'email')}
                            centered
                            className="mb-6"
                            items={[
                                {
                                    key: 'password',
                                    label: '密码登录',
                                },
                                {
                                    key: 'email',
                                    label: '邮箱登录',
                                }
                            ]}
                        />
                    )}

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

                    {!showVerification ? (
                        // 登录表单
                        <Form onFinish={loginMode === 'password' ? handlePasswordLogin : handleEmailLogin} layout="vertical">
                            <Form.Item
                                label={loginMode === 'password' ? '用户名或邮箱' : '邮箱地址'}
                                required
                            >
                                <Input
                                    prefix={loginMode === 'email' ? <MailOutlined /> : <UserOutlined />}
                                    type={loginMode === 'email' ? 'email' : 'text'}
                                    placeholder={loginMode === 'password' ? '请输入用户名或邮箱' : '请输入邮箱地址'}
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    size="large"
                                    className="rounded-lg"
                                />
                            </Form.Item>

                            {loginMode === 'password' && (
                                <>
                                    <Form.Item
                                        label="密码"
                                        required
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined />}
                                            placeholder="请输入密码"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            size="large"
                                            className="rounded-lg"
                                        />
                                    </Form.Item>

                                    <Form.Item>
                                        <Checkbox
                                            checked={remember}
                                            onChange={(e) => setRemember(e.target.checked)}
                                        >
                                            记住我
                                        </Checkbox>
                                    </Form.Item>
                                </>
                            )}

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading.login || loading.emailLogin}
                                    size="large"
                                    block
                                    className="rounded-lg h-12 font-medium"
                                    style={{
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        border: 'none',
                                    }}
                                >
                                    {loading.login || loading.emailLogin
                                        ? (loginMode === 'password' ? '登录中...' : '发送中...')
                                        : (loginMode === 'password' ? '登录' : '发送验证码')}
                                </Button>
                            </Form.Item>

                            {/* 忘记密码链接 */}
                            {loginMode === 'password' && (
                                <div className="text-center mb-4">
                                    <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800 transition-colors">
                                        忘记密码？
                                    </Link>
                                </div>
                            )}
                        </Form>
                    ) : (
                        // 验证码表单
                        <>
                            <Alert
                                message={`验证码已发送至 ${identifier}，请检查邮箱`}
                                type="info"
                                showIcon
                                className="mb-4"
                            />

                            <Form onFinish={handleVerificationLogin} layout="vertical">
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
                                        loading={loading.verify}
                                        size="large"
                                        block
                                        className="rounded-lg h-12 font-medium"
                                        style={{
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            border: 'none',
                                        }}
                                    >
                                        {loading.verify ? '验证中...' : '验证并登录'}
                                    </Button>
                                </Form.Item>

                                <div className="flex flex-wrap justify-between gap-2">
                                    <Button
                                        type="text"
                                        onClick={() => {
                                            setShowVerification(false);
                                            setVerificationCode('');
                                            setError(null);
                                        }}
                                        className="text-gray-600"
                                    >
                                        返回
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
                            </Form>
                        </>
                    )}

                    {/* 注册链接 */}
                    <Divider>或</Divider>
                    <div className="text-center">
                        <Text className="text-gray-600">没有账号？</Text>
                        <Link to="/register" className="text-blue-600 hover:text-blue-800 ml-1 transition-colors font-medium">
                            立即注册
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
