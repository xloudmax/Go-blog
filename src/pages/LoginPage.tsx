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
import { useTheme } from "../components/ThemeProvider";

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
    const { isDarkMode } = useTheme();
    const navigate = useNavigate();

    // 表单状态
    const [loginMode, setLoginMode] = useState<'password' | 'email'>('password');
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");
    const [showVerification, setShowVerification] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);

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

    // 倒计时效果
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [countdown]);

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
            const result = await emailLogin(identifier);
            if (result?.success) {
                setShowVerification(true);
                setCountdown(60); // 60秒倒计时
            }
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

        if (verificationCode.length !== 6) {
            setError("请输入6位验证码");
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
            // 处理不同类型的错误
            const errorMessage = err.message || "验证失败，请重试";
            if (errorMessage.includes('验证码错误') || errorMessage.includes('验证码已过期')) {
                setError("验证码错误或已过期，请重新获取");
            } else if (errorMessage.includes('用户不存在')) {
                setError("用户不存在，请检查邮箱地址");
            } else {
                setError(errorMessage);
            }
        }
    };

    // 重新发送验证码
    const handleResendCode = async () => {
        if (!identifier) {
            setError("请先输入邮箱地址");
            return;
        }

        if (!validateEmail(identifier)) {
            setError("请输入有效的邮箱地址");
            return;
        }

        setError(null);
        try {
            const result = await sendVerificationCode(identifier, 'LOGIN');
            if (result?.success) {
                // 清空之前的验证码输入
                setVerificationCode('');
                setCountdown(60); // 重新开始60秒倒计时
                // 验证码重新发送成功
            }
        } catch (err: any) {
            setError(err.message || "发送验证码失败，请稍后重试");
        }
    };

    // 根据主题动态生成背景样式
    const getBackgroundStyle = () => {
        if (isDarkMode) {
            return {
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23374151' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), linear-gradient(135deg, #1f2937 0%, #111827 100%)`,
            };
        } else {
            return {
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e0e7ff' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"), linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
            };
        }
    };

    return (
        <div
            className={`min-h-screen flex items-center justify-center px-4 relative transition-all duration-300 ${
                isDarkMode ? 'bg-gray-900' : 'bg-white'
            }`}
            style={getBackgroundStyle()}
        >
            {/* 背景模糊层 - 仅在未登录时显示 */}
            {!isAuthenticated && (
                <div
                    className={`absolute inset-0 ${
                        isDarkMode ? 'bg-black/20' : 'bg-white/10'
                    } transition-all duration-300`}
                    style={{
                        backdropFilter: 'blur(5px)',
                        WebkitBackdropFilter: 'blur(5px)',
                    }}
                />
            )}

            <div className="w-full max-w-md relative z-10">
                <Card
                    className={`shadow-2xl border-0 transition-all duration-300 ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}
                    style={{
                        background: isDarkMode 
                            ? 'rgba(31, 41, 55, 0.95)' 
                            : 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        borderRadius: '16px',
                        maxWidth: '400px', // 限制最大宽度
                        margin: '0 auto', // 居中对齐
                    }}
                >
                    <div className="text-center mb-6">
                        <Title 
                            level={2} 
                            className={`mb-0 ${
                                isDarkMode ? 'text-white' : 'text-gray-800'
                            }`}
                        >
                            欢迎回来
                        </Title>
                        <Text 
                            type="secondary" 
                            className={`${
                                isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            请登录您的账户
                        </Text>
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
                                    <Link 
                                        to="/forgot-password" 
                                        className={`transition-colors ${
                                            isDarkMode 
                                                ? 'text-blue-400 hover:text-blue-300' 
                                                : 'text-blue-600 hover:text-blue-800'
                                        }`}
                                    >
                                        忘记密码？
                                    </Link>
                                </div>
                            )}
                        </Form>
                    ) : (
                        // 验证码表单
                        <>
                            <Alert
                                message={
                                    <div>
                                        <div>验证码已发送至 <strong>{identifier}</strong></div>
                                        <div className="text-sm mt-1 opacity-75">
                                            请检查邮箱（包括垃圾邮件文件夹），验证码有效期为5分钟
                                        </div>
                                    </div>
                                }
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
                                        onChange={(e) => {
                                            // 只允许输入数字
                                            const value = e.target.value.replace(/\D/g, '');
                                            setVerificationCode(value);
                                            // 清除错误信息
                                            if (error && value.length > 0) {
                                                setError(null);
                                            }
                                        }}
                                        maxLength={6}
                                        size="large"
                                        className="rounded-lg text-center tracking-widest"
                                        style={{ 
                                            fontSize: '18px',
                                            letterSpacing: '0.5em'
                                        }}
                                        autoComplete="one-time-code"
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
                                            setCountdown(0);
                                        }}
                                        className={`${
                                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                        }`}
                                    >
                                        返回
                                    </Button>
                                    <Button
                                        type="text"
                                        loading={loading.sendCode}
                                        disabled={countdown > 0}
                                        onClick={handleResendCode}
                                        className={`${
                                            countdown > 0 
                                                ? 'text-gray-400 cursor-not-allowed' 
                                                : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                        }`}
                                    >
                                        {loading.sendCode 
                                            ? '发送中...' 
                                            : countdown > 0 
                                                ? `重新发送(${countdown}s)` 
                                                : '重新发送'
                                        }
                                    </Button>
                                </div>
                            </Form>
                        </>
                    )}

                    {/* 注册链接 */}
                    <Divider>或</Divider>
                    <div className="text-center">
                        <Text className={`${
                            isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                            没有账号？
                        </Text>
                        <Link 
                            to="/register" 
                            className={`ml-1 transition-colors font-medium ${
                                isDarkMode 
                                    ? 'text-blue-400 hover:text-blue-300' 
                                    : 'text-blue-600 hover:text-blue-800'
                            }`}
                        >
                            立即注册
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
