#!/bin/bash
# 测试邮件发送功能
# 使用方法: ./test_email.sh your-email@gmail.com

if [ -z "$1" ]; then
  echo "错误: 请提供测试邮箱地址"
  echo "用法: ./test_email.sh your-test-email@example.com"
  exit 1
fi

TEST_EMAIL="$1"

echo "正在测试邮件发送功能..."
echo "目标邮箱: $TEST_EMAIL"
echo ""

# 检查环境变量是否已设置
source .env

if [ -z "$SMTP_USERNAME" ] || [ "$SMTP_USERNAME" = "your-email@gmail.com" ]; then
  echo "❌ 错误: SMTP_USERNAME 未配置"
  echo "请编辑 backend/.env 文件并设置您的 Gmail 地址"
  exit 1
fi

if [ -z "$SMTP_PASSWORD" ] || [ "$SMTP_PASSWORD" = "your-16-char-app-password" ]; then
  echo "❌ 错误: SMTP_PASSWORD 未配置"
  echo "请按照以下步骤创建 Gmail App Password:"
  echo "1. 访问 https://myaccount.google.com/apppasswords"
  echo "2. 选择 '邮件' 应用"
  echo "3. 复制生成的 16 位密码"
  echo "4. 将密码粘贴到 backend/.env 的 SMTP_PASSWORD 字段"
  exit 1
fi

# 使用 GraphQL mutation 测试发送验证码
echo "发送测试验证码到 $TEST_EMAIL..."

RESPONSE=$(curl -s -X POST http://localhost:11451/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { sendVerificationCode(email: \"'$TEST_EMAIL'\", type: REGISTER) }"
  }')

echo "服务器响应:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q "\"sendVerificationCode\":true"; then
  echo ""
  echo "✅ 邮件发送成功！"
  echo "请检查 $TEST_EMAIL 的收件箱（可能在垃圾邮件文件夹中）"
else
  echo ""
  echo "❌ 邮件发送失败"
  echo "请检查后端日志以获取详细错误信息"
  echo ""
  echo "常见问题:"
  echo "1. 确认已启用 Gmail 两步验证"
  echo "2. 确认使用的是 App Password 而非常规密码"
  echo "3. 确认 SMTP_USERNAME 是完整的 Gmail 地址"
  echo "4. 确认后端服务器正在运行 (端口 11451)"
fi
