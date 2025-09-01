import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
    Card, 
    Button, 
    Input, 
    Alert, 
    Form, 
    Typography, 
    Divider,
    Steps
} from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from "../hooks";

const { Title } = Typography;

export default function ForgotPasswordPage() {
    // GraphQL hooks
    const { requestPasswordReset, confirmPasswordReset, loading } = useAuth();
    const navigate = useNavigate();
    
    // 页面状态
    const [currentStep, setCurrentStep] = useState<'request' | 'reset'>('request');
    
    // 表单状态
    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    // 请求密码重置
    const handleRequestReset = async () => {
        if (!email) {
            setError("请输入邮箱地址");
            return;
        }
        
        // 简单的邮箱格式验证
        if (!email.includes('@')) {
            setError("请输入有效的邮箱地址");
            return;
        }

        setError(null);
        setSuccessMessage(null);
        try {
            await requestPasswordReset(email);
            setSuccessMessage("密码重置邮件已发送到您的邮箱，请检查收件箱");
            setCurrentStep('reset');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "发送密码重置邮件失败，请重试";
            setError(errorMessage);
        }
    };

    // 确认密码重置
    const handleConfirmReset = async () => {
        if (!token.trim()) {
            setError("请输入重置令牌");
            return;
        }

        if (!newPassword) {
            setError("请输入新密码");
            return;
        }

        if (newPassword.length < 6) {
            setError("密码长度至少为6位");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("两次输入的密码不一致");
            return;
        }

        setError(null);
        setSuccessMessage(null);
        try {
            await confirmPasswordReset(token, newPassword);
            setSuccessMessage("密码重置成功，请使用新密码登录");
            // 3秒后跳转到登录页面
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "密码重置失败，请重试";
            setError(errorMessage);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <Card className="shadow-lg">
                    <div className="text-center mb-6">
                        <Title level={2} className="mb-0">
                            {currentStep === 'request' ? '忘记密码' : '重置密码'}
                        </Title>
                    </div>

                    {/* 步骤指示器 */}
                    <Steps
                        current={currentStep === 'request' ? 0 : 1}
                        className="mb-6"
                        items={[
                            {
                                title: '请求重置',
                            },
                            {
                                title: '重置密码',
                            }
                        ]}
                    />

                    {error && (
                        <Alert
                            message={error}
                            type="error"
                            showIcon
                            className="mb-4"
                        />
                    )}

                    {successMessage && (
                        <Alert
                            message={successMessage}
                            type="success"
                            showIcon
                            className="mb-4"
                        />
                    )}

                    {currentStep === 'request' ? (
                        // 请求重置表单
                        <Form onFinish={handleRequestReset} layout="vertical">
                            <Form.Item
                                label="邮箱地址"
                                required
                            >
                                <Input
                                    prefix={<MailOutlined />}
                                    type="email"
                                    placeholder="请输入注册时使用的邮箱地址"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading.resetRequest}
                                    size="large"
                                    block
                                >
                                    {loading.resetRequest ? '发送中...' : '发送重置邮件'}
                                </Button>
                            </Form.Item>
                        </Form>
                    ) : (
                        // 重置密码表单
                        <Form onFinish={handleConfirmReset} layout="vertical">
                            <Form.Item
                                label="重置令牌"
                                required
                            >
                                <Input
                                    prefix={<LockOutlined />}
                                    placeholder="请输入邮件中的重置令牌"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                label="新密码"
                                required
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="请输入新密码（至少6个字符）"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item
                                label="确认新密码"
                                required
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder="请再次输入新密码"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    size="large"
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading.resetConfirm}
                                    size="large"
                                    block
                                >
                                    {loading.resetConfirm ? '重置中...' : '重置密码'}
                                </Button>
                            </Form.Item>
                        </Form>
                    )}

                    {/* 登录链接 */}
                    <Divider>或</Divider>
                    <div className="text-center">
                        <Link to="/login" className="text-blue-600 hover:text-blue-800">
                            返回登录
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}