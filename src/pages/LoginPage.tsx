import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
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
import { AuthLayout } from "../layouts/AuthLayout";
import { LiquidButton } from "../components/LiquidButton";

const { Text } = Typography;

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
        } catch (err: unknown) {
            // 处理登录错误
            const error = err as Error;
            if (error.message && error.message.includes('用户名或密码错误')) {
                setError('用户名或密码错误，请检查后重试');
            } else {
                setError(error.message || '登录失败，请稍后重试');
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
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || "发送验证码失败，请重试");
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
        } catch (err: unknown) {
            // 处理不同类型的错误
            const error = err as Error;
            const errorMessage = error.message || "验证失败，请重试";
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
        } catch (err: unknown) {
            const error = err as Error;
            setError(error.message || "发送验证码失败，请稍后重试");
        }
    };

    const commonInputStyle = {
        background: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)'}`,
        color: isDarkMode ? 'white' : '#1f2937',
        backdropFilter: 'blur(10px)',
        // Simulating glass reflection/depth
        boxShadow: isDarkMode 
            ? 'inset 0 1px 0 rgba(255,255,255,0.05)' 
            : 'inset 0 1px 0 rgba(255,255,255,0.6)',
    };

    return (
        <AuthLayout
            title="欢迎回来"
            subtitle="请登录您的账户"
        >
            {/* 登录模式切换 */}
            {!showVerification && (
                <Tabs
                    activeKey={loginMode}
                    onChange={(key) => setLoginMode(key as 'password' | 'email')}
                    centered
                    className="mb-8"
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
                    className="mb-6 rounded-lg"
                    closable
                    onClose={() => setError(null)}
                />
            )}

            {!showVerification ? (
                // 登录表单
                <Form onFinish={loginMode === 'password' ? handlePasswordLogin : handleEmailLogin} layout="vertical" size="large">
                    <Form.Item
                        label={loginMode === 'password' ? '用户名或邮箱' : '邮箱地址'}
                        required
                        className="mb-4"
                    >
                        <Input
                            prefix={loginMode === 'email' 
                                ? <MailOutlined className="text-gray-400" /> 
                                : <UserOutlined className="text-gray-400" />
                            }
                            type={loginMode === 'email' ? 'email' : 'text'}
                            placeholder={loginMode === 'password' ? '用户名或邮箱' : '邮箱地址'}
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="rounded-xl bg-transparent"
                            style={commonInputStyle}
                        />
                    </Form.Item>

                    {loginMode === 'password' && (
                        <>
                            <Form.Item
                                label="密码"
                                required
                                className="mb-4"
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="text-gray-400" />}
                                    placeholder="密码"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="rounded-xl"
                                    style={commonInputStyle}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Checkbox
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                                >
                                    记住我
                                </Checkbox>
                            </Form.Item>
                        </>
                    )}

                    <Form.Item>
                        <LiquidButton
                            htmlType="submit"
                            loading={loading.login || loading.emailLogin}
                            className="w-full h-12 text-lg font-semibold"
                        >
                            {loading.login || loading.emailLogin
                                ? (loginMode === 'password' ? '登录中...' : '发送中...')
                                : (loginMode === 'password' ? '登录' : '发送验证码')}
                        </LiquidButton>
                    </Form.Item>

                    {/* 忘记密码链接 */}
                    {loginMode === 'password' && (
                        <div className="text-center mb-4">
                            <Link 
                                to="/forgot-password" 
                                className={`transition-colors text-sm ${
                                    isDarkMode 
                                        ? 'text-indigo-400 hover:text-indigo-300' 
                                        : 'text-indigo-600 hover:text-indigo-800'
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
                        message="验证码已发送"
                        description={
                            <div className="space-y-1">
                                <div>发送至 <strong>{identifier}</strong></div>
                                <div className="opacity-75 text-xs">有效期5分钟</div>
                            </div>
                        }
                        type="success"
                        showIcon
                        className="mb-8 rounded-lg border-green-200 bg-green-50"
                    />

                    <Form onFinish={handleVerificationLogin} layout="vertical">
                        <Form.Item className="mb-8 text-center">
                            <Input
                                placeholder="000000"
                                value={verificationCode}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    setVerificationCode(value);
                                    if (error && value.length > 0) setError(null);
                                }}
                                maxLength={6}
                                className="text-center text-3xl font-mono tracking-[0.5em] rounded-xl h-16"
                                style={commonInputStyle}
                                autoComplete="one-time-code"
                            />
                        </Form.Item>

                        <Form.Item>
                            <LiquidButton
                                htmlType="submit"
                                loading={loading.verify}
                                className="w-full h-12 text-lg font-semibold"
                            >
                                {loading.verify ? '验证中...' : '验证并登录'}
                            </LiquidButton>
                        </Form.Item>

                        <div className="flex flex-wrap justify-between gap-2 px-2 mt-6">
                            <LiquidButton
                                variant="ghost"
                                onClick={() => {
                                    setShowVerification(false);
                                    setVerificationCode('');
                                    setError(null);
                                    setCountdown(0);
                                }}
                                className={isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'}
                            >
                                返回
                            </LiquidButton>
                            <LiquidButton
                                variant="ghost"
                                loading={loading.sendCode}
                                disabled={countdown > 0}
                                onClick={handleResendCode}
                                className={`${
                                    countdown > 0 
                                        ? 'text-gray-400 cursor-not-allowed' 
                                        : 'text-indigo-500 hover:text-indigo-600'
                                }`}
                            >
                                {loading.sendCode 
                                    ? '发送中...' 
                                    : countdown > 0 
                                        ? `重新发送(${countdown}s)` 
                                        : '重新发送'
                                }
                            </LiquidButton>
                        </div>
                    </Form>
                </>
            )}

            <Divider style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>或</span>
            </Divider>
            
            <div className="text-center">
                <Text className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                    没有账号？
                </Text>
                <Link 
                    to="/register" 
                    className="ml-2 font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
                >
                    立即注册
                </Link>
            </div>
        </AuthLayout>
    );
}
