import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Button,
  Input,
  Alert,
  Steps,
  Form,
  Typography,
  Divider,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { useAuth, useAppUser } from "../hooks";
import { useTheme } from "../components/ThemeProvider";
import { AuthLayout } from "../layouts/AuthLayout";

const { Text } = Typography;

export default function RegisterPage() {
  // GraphQL hooks
  const { register, sendVerificationCode, verifyEmail, loading } = useAuth();
  const { isAuthenticated } = useAppUser();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // 页面状态
  const [currentStep, setCurrentStep] = useState<"register" | "verify">(
    "register"
  );

  // 注册表单状态
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    inviteCode: "",
  });

  // 验证状态
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 如果已登录，重定向到博客主页
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // 表单验证
  const validateForm = () => {
    const { username, email, password, confirmPassword } = formData;

    if (!username.trim()) {
      setError("用户名不能为空");
      return false;
    }

    if (username.length < 3) {
      setError("用户名至少3个字符");
      return false;
    }

    if (!email.trim()) {
      setError("邮箱不能为空");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("请输入有效的邮箱地址");
      return false;
    }

    if (!password.trim()) {
      setError("密码不能为空");
      return false;
    }

    if (password.length < 6) {
      setError("密码至少6个字符");
      return false;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
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
      await sendVerificationCode(formData.email, "REGISTER");
      setCurrentStep("verify");
    } catch (err: any) {
      setError(err.message || "注册失败，请重试");
    }
  };

  // 处理邮箱验证
  const handleVerifyEmail = async () => {
    if (!verificationCode.trim()) {
      setError("请输入验证码");
      return;
    }

    setError(null);
    try {
      await verifyEmail(formData.email, verificationCode, "REGISTER");
      // 验证成功，直接跳转到博客主页
      navigate("/", {
        state: {
          message: "注册成功，欢迎来到博客！",
          email: formData.email,
        },
      });
    } catch (err: any) {
      setError(err.message || "验证码错误或已过期");
    }
  };

  // 重新发送验证码
  const handleResendCode = async () => {
    setError(null);
    try {
      await sendVerificationCode(formData.email, "REGISTER");
    } catch (err: any) {
      setError(err.message || "发送验证码失败");
    }
  };

  // 处理表单输入
  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
      // 清除错误
      if (error) setError(null);
    };



  return (
    <AuthLayout
      title={currentStep === "register" ? "加入我们" : "验证邮箱"}
      subtitle={currentStep === "register" ? "开启您的创作之旅" : "安全验证"}
    >
      {/* 步骤指示器 */}
      <Steps
        current={currentStep === "register" ? 0 : 1}
        className="mb-8"
        size="small"
        items={[
          { title: "填写信息" },
          { title: "验证邮箱" },
          { title: "完成" },
        ]}
      />

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

      {currentStep === "register" ? (
        <Form onFinish={handleRegister} layout="vertical" size="large">
          <Form.Item name="username" rules={[{ required: true, message: '' }]} className="mb-4">
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="用户名"
              value={formData.username}
              onChange={handleInputChange("username")}
              className="rounded-xl bg-transparent"
              style={{
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)',
                  borderColor: 'transparent',
                  color: isDarkMode ? 'white' : '#1f2937',
                  backdropFilter: 'blur(10px)',
                  boxShadow: isDarkMode ? 'inset 0 1px 2px rgba(0,0,0,0.2)' : 'inset 0 1px 2px rgba(255,255,255,0.6)',
              }}
            />
          </Form.Item>

          <Form.Item name="email" rules={[{ required: true, message: '' }]} className="mb-4">
            <Input
              prefix={<MailOutlined className="text-gray-400" />}
              type="email"
              placeholder="电子邮箱"
              value={formData.email}
              onChange={handleInputChange("email")}
              className="rounded-xl"
              style={{
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)',
                  borderColor: 'transparent',
                  color: isDarkMode ? 'white' : '#1f2937',
                  backdropFilter: 'blur(10px)',
                  boxShadow: isDarkMode ? 'inset 0 1px 2px rgba(0,0,0,0.2)' : 'inset 0 1px 2px rgba(255,255,255,0.6)',
              }}
            />
          </Form.Item>

          <Form.Item name="password" rules={[{ required: true, message: '' }]} className="mb-4">
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="设置密码"
              value={formData.password}
              onChange={handleInputChange("password")}
              className="rounded-xl"
              style={{
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)',
                  borderColor: 'transparent',
                  color: isDarkMode ? 'white' : '#1f2937',
                  backdropFilter: 'blur(10px)',
                  boxShadow: isDarkMode ? 'inset 0 1px 2px rgba(0,0,0,0.2)' : 'inset 0 1px 2px rgba(255,255,255,0.6)',
              }}
            />
          </Form.Item>

          <Form.Item name="confirmPassword" rules={[{ required: true, message: '' }]} className="mb-4">
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="确认密码"
              value={formData.confirmPassword}
              onChange={handleInputChange("confirmPassword")}
              className="rounded-xl"
              style={{
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)',
                  borderColor: 'transparent',
                  color: isDarkMode ? 'white' : '#1f2937',
                  backdropFilter: 'blur(10px)',
                  boxShadow: isDarkMode ? 'inset 0 1px 2px rgba(0,0,0,0.2)' : 'inset 0 1px 2px rgba(255,255,255,0.6)',
              }}
            />
          </Form.Item>

          <Form.Item name="inviteCode" className="mb-6">
            <Input
              prefix={<SafetyOutlined className="text-gray-400" />}
              placeholder="邀请码（可选）"
              value={formData.inviteCode}
              onChange={handleInputChange("inviteCode")}
              className="rounded-xl"
              style={{
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)',
                  borderColor: 'transparent',
                  color: isDarkMode ? 'white' : '#1f2937',
                  backdropFilter: 'blur(10px)',
                  boxShadow: isDarkMode ? 'inset 0 1px 2px rgba(0,0,0,0.2)' : 'inset 0 1px 2px rgba(255,255,255,0.6)',
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading.register}
              block
              className="rounded-xl h-12 text-lg font-semibold shadow-lg hover:scale-[1.02] transition-transform"
              style={{
                background: "linear-gradient(to right, #6366f1, #8b5cf6)", // Indigo to Violet
                border: "none",
              }}
            >
              {loading.register ? "注册中..." : "立即注册"}
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <>
          <Alert
            message="验证码已发送"
            description={`请检查 ${formData.email} 的收件箱`}
            type="success"
            showIcon
            className="mb-8 rounded-lg border-green-200 bg-green-50"
          />

          <Form onFinish={handleVerifyEmail} layout="vertical">
            <Form.Item className="mb-8 text-center">
              <Input
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                className="text-center text-3xl font-mono tracking-[0.5em] rounded-xl h-16"
                style={{
                  background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)',
                  borderColor: 'transparent',
                  color: isDarkMode ? 'white' : '#1f2937',
                  backdropFilter: 'blur(10px)',
                  boxShadow: isDarkMode ? 'inset 0 1px 2px rgba(0,0,0,0.2)' : 'inset 0 1px 2px rgba(255,255,255,0.6)',
                }}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading.verifyEmail}
                block
                className="rounded-xl h-12 text-lg font-semibold shadow-lg hover:scale-[1.02] transition-transform"
                style={{
                    background: "linear-gradient(to right, #6366f1, #8b5cf6)",
                    border: "none",
                }}
              >
                完成验证
              </Button>
            </Form.Item>
          </Form>

          <div className="flex justify-between mt-6 px-2">
            <Button
              type="text"
              onClick={() => {
                setCurrentStep("register");
                setVerificationCode("");
                setError(null);
              }}
              className={isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"}
            >
              返回修改
            </Button>
            <Button
              type="text"
              loading={loading.sendCode}
              onClick={handleResendCode}
              className="text-indigo-500 hover:text-indigo-600"
            >
              重新发送
            </Button>
          </div>
        </>
      )}

      <Divider style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
        <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>或</span>
      </Divider>
      
      <div className="text-center">
        <Text className={isDarkMode ? "text-gray-400" : "text-gray-500"}>已有账号？</Text>
        <Link
          to="/login"
          className="ml-2 font-semibold text-indigo-500 hover:text-indigo-600 transition-colors"
        >
          直接登录
        </Link>
      </div>
    </AuthLayout>
  );
}
