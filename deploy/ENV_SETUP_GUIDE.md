# 环境变量快速设置指南

## 📋 已生成的密钥

以下密钥已经生成并配置在 `backend/.env` 中：

### 🔑 关键密钥
- **JWT密钥**: `X5cIMqG0p7tqKlSPvx408x660KtbtXsdzwCYdjJWn09bJwY2Fpwya91sadot108A`
- **管理员邀请码**: `76e2f0f3a8ee99ce498376118af55293`

⚠️ **安全提示**:
- 这些密钥已在本地 `.env` 文件中配置
- `.env` 文件已添加到 `.gitignore`，不会提交到git
- 生产部署时需要使用不同的密钥

---

## 🚀 快速启动

### 方法1: 使用 .env 文件（推荐）

后端会自动加载 `backend/.env` 文件，直接启动即可：

```bash
cd backend
go run main.go
```

### 方法2: 使用环境变量脚本

```bash
# 设置环境变量
source backend/set_env.sh

# 启动后端
cd backend && go run main.go
```

### 方法3: 手动设置环境变量

```bash
export JWT_SECRET="X5cIMqG0p7tqKlSPvx408x660KtbtXsdzwCYdjJWn09bJwY2Fpwya91sadot108A"
export ADMIN_INVITE_CODE="76e2f0f3a8ee99ce498376118af55293"
cd backend && go run main.go
```

---

## 👨‍💼 创建管理员账号

使用生成的管理员邀请码注册管理员账号：

### 使用GraphQL Playground

1. 访问 http://localhost:11451/graphql
2. 执行以下mutation:

```graphql
mutation {
  register(input: {
    username: "admin"
    email: "admin@example.com"
    password: "Admin123456"
    inviteCode: "76e2f0f3a8ee99ce498376118af55293"
  }) {
    token
    user {
      id
      username
      role
    }
  }
}
```

### 使用curl

```bash
curl -X POST http://localhost:11451/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { register(input: { username: \"admin\", email: \"admin@example.com\", password: \"Admin123456\", inviteCode: \"76e2f0f3a8ee99ce498376118af55293\" }) { token user { id username role } } }"
  }'
```

**注意**: 密码必须满足以下要求：
- 至少8个字符
- 包含大写字母、小写字母、数字中的至少两种
- 不能是常见弱密码

---

## 📊 当前配置摘要

### 开发环境配置
```
环境模式: debug
端口: 11451
数据库: SQLite (blog_platform.db)
缓存: 内存缓存（无需Redis）
邮件: 已禁用（开发环境不发送真实邮件）
CORS: 允许 localhost:5173, 5174
```

### 验证码存储
- **当前方案**: 内存存储（适合开发和小流量生产）
- **特点**:
  - 无需额外依赖
  - 服务重启后验证码失效
  - 单机部署友好
- **替代方案**: 如需多实例部署，可使用数据库存储

---

## 🔧 配置文件说明

### backend/.env
- **用途**: 开发环境配置
- **位置**: `/home/ubuntu/workspace/C404-blog/backend/.env`
- **Git**: 已在 .gitignore 中，不会提交

### backend/.env.example
- **用途**: 配置模板和文档
- **位置**: `/home/ubuntu/workspace/C404-blog/backend/.env.example`
- **Git**: 会提交到仓库，供他人参考

### backend/.env.production
- **用途**: 生产环境配置模板
- **位置**: `/home/ubuntu/workspace/C404-blog/backend/.env.production`
- **注意**: 需要修改其中的 CHANGE_THIS 标记

---

## 📝 环境变量列表

### 必需的环境变量
```bash
JWT_SECRET                 # JWT签名密钥
GIN_MODE                   # 运行模式 (debug/release)
PORT                       # 服务端口
DATABASE_URL               # 数据库连接
```

### 可选的环境变量
```bash
ADMIN_INVITE_CODE          # 管理员邀请码
LOG_LEVEL                  # 日志级别
EMAIL_ENABLED              # 是否启用邮件
SMTP_HOST                  # SMTP服务器
SMTP_PORT                  # SMTP端口
SMTP_USERNAME              # SMTP用户名
SMTP_PASSWORD              # SMTP密码
ALLOWED_ORIGINS            # CORS允许的源
RATE_LIMIT_ENABLED         # 是否启用限流
REQUESTS_PER_MINUTE        # 每分钟请求数限制
```

---

## ⚙️ 生产环境部署

生产环境需要使用不同的配置：

### 1. 生成新密钥
```bash
# 生成JWT密钥
openssl rand -base64 48

# 生成管理员邀请码
openssl rand -hex 16

# 生成数据库密码
openssl rand -base64 24
```

### 2. 更新环境变量
```bash
# 编辑生产配置
nano backend/.env.production

# 或者通过环境变量设置
export JWT_SECRET="生产环境的密钥"
export ADMIN_INVITE_CODE="生产环境的邀请码"
export GIN_MODE="release"
export DATABASE_URL="postgresql://user:pass@localhost/dbname"
```

### 3. 使用systemd服务
参见 `deploy/systemd/blog-backend.service`

---

## 🧪 测试环境变量

验证环境变量是否正确加载：

```bash
# 启动后端
cd backend && go run main.go

# 在另一个终端测试
curl http://localhost:11451/health/ping

# 预期输出:
# {"status":"ok","message":"service is running","time":1699999999}
```

---

## 🔍 故障排查

### 问题1: JWT密钥未设置
**错误信息**: `JWT_SECRET environment variable not set`

**解决方案**:
```bash
# 确认 .env 文件存在
ls -la backend/.env

# 或手动设置
export JWT_SECRET="你的密钥"
```

### 问题2: 数据库连接失败
**错误信息**: `database connection failed`

**解决方案**:
```bash
# 检查数据库文件权限
ls -la backend/blog_platform.db

# 确保目录可写
chmod 755 backend/
```

### 问题3: CORS错误
**错误信息**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**解决方案**:
```bash
# 更新 .env 文件中的 ALLOWED_ORIGINS
ALLOWED_ORIGINS=http://localhost:5173,http://your-frontend-url
```

---

## 📞 常见问题

**Q: 为什么不使用Redis?**
A: 内存存储足够用于：
- 开发环境
- 小流量生产环境（< 1000 QPS）
- 单机部署
如需高可用，可后续迁移到Redis或数据库存储。

**Q: 管理员邀请码会过期吗?**
A: 不会。管理员邀请码可以重复使用，直到你更改或删除它。

**Q: 可以禁用管理员邀请码吗?**
A: 可以。将 `ADMIN_INVITE_CODE` 设为空字符串即可禁用。

**Q: 邮件功能何时启用?**
A: 当你配置了SMTP后，将 `EMAIL_ENABLED=true` 即可启用。

---

## 📚 相关文档

- [安全检查清单](./SECURITY_CHECKLIST.md)
- [部署指南](./DEPLOYMENT.md)
- [安全修复总结](./SECURITY_FIX_SUMMARY.md)

---

**最后更新**: 2025-11-07
**配置状态**: ✅ 已配置完成
