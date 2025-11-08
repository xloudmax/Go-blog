# 安全检查清单

## ⚠️ 关键安全问题

### 已发现的问题

#### 1. 敏感文件已提交到Git仓库
**严重性**: 🔴 严重

**文件**:
- `backend/.env` - 包含JWT密钥、数据库配置
- `backend/blog_platform.db` - 数据库文件（包含用户数据）
- `backend/data.db` - 数据库文件
- `blog_platform.db` - 数据库文件

**风险**: 如果仓库是公开的，任何人都可以获取你的密钥和数据库

**修复**:
1. 立即将仓库设为私有（如果是公开的）
2. 清理Git历史（见DEPLOYMENT.md）
3. 更换所有密钥
4. 重置所有用户密码

#### 2. 弱JWT密钥
**严重性**: 🔴 严重

**当前值**: `JNU_technicians_club`

**风险**: 攻击者可以伪造JWT令牌，冒充任何用户

**修复**: 已在 `backend/.env.production` 中生成强随机密钥

#### 3. 开发模式配置
**严重性**: 🟡 中等

**问题**:
- `GIN_MODE=debug` - 会暴露详细错误信息
- `ALLOWED_ORIGINS` 包含localhost

**修复**: 已在 `.env.production` 中配置为release模式

## ✅ 部署前检查清单

### 必须完成（部署前）

- [ ] 清理Git历史中的敏感文件
- [ ] 更换JWT密钥为强随机值
- [ ] 配置正确的数据库连接字符串
- [ ] 更新CORS允许的域名
- [ ] 将仓库设为私有（或确保.env不在仓库中）
- [ ] 设置强数据库密码
- [ ] 配置防火墙规则
- [ ] 禁用开发模式

### 推荐完成（提高安全性）

- [ ] 配置HTTPS/SSL证书
- [ ] 启用rate limiting
- [ ] 配置fail2ban防止暴力破解
- [ ] 设置数据库备份
- [ ] 配置日志监控
- [ ] 添加安全响应头
- [ ] 启用邮件验证
- [ ] 配置CSP（内容安全策略）

### 代码安全审查

- [ ] 检查SQL注入防护（使用GORM已自动防护）
- [ ] 检查XSS防护（React已自动转义）
- [ ] 检查CSRF防护
- [ ] 审查文件上传限制
- [ ] 检查认证授权逻辑
- [ ] 审查密码存储（使用bcrypt）

## 🔒 密钥管理

### 当前密钥状态

| 密钥 | 当前状态 | 建议操作 |
|------|---------|---------|
| JWT_SECRET | ⚠️ 弱密钥 | ✅ 已生成新密钥 |
| 数据库密码 | ⚠️ 需设置 | 设置强密码 |
| SMTP密码 | ℹ️ 未配置 | 如需邮件功能需配置 |

### 生成新密钥的命令

```bash
# JWT密钥（64字符）
openssl rand -base64 48

# 数据库密码（32字符）
openssl rand -base64 24

# 随机字符串
openssl rand -hex 16
```

## 🛡️ 部署后验证

### 安全测试

```bash
# 1. 测试HTTPS配置
curl -I https://yourdomain.com

# 2. 检查响应头
curl -I http://your-server-ip | grep -i "x-frame-options\|x-content-type\|x-xss"

# 3. 测试CORS
curl -H "Origin: http://evil.com" -I http://your-server-ip/graphql

# 4. 测试rate limiting
for i in {1..100}; do curl http://your-server-ip/graphql & done

# 5. 检查敏感文件是否可访问
curl http://your-server-ip/.env
curl http://your-server-ip/backend/.env
```

### 服务状态检查

```bash
# 检查服务运行状态
sudo systemctl status blog-backend
sudo systemctl status nginx
sudo systemctl status postgresql

# 检查端口监听
sudo netstat -tlnp | grep -E '80|443|11451|5432'

# 检查防火墙
sudo ufw status
```

## 🚨 应急响应

### 如果密钥泄露

1. **立即更换所有密钥**
```bash
# 停止服务
sudo systemctl stop blog-backend

# 更新.env中的JWT_SECRET
# 重启服务
sudo systemctl start blog-backend
```

2. **强制所有用户重新登录**
   - 所有旧的JWT令牌将失效

3. **审查日志**
```bash
# 查找可疑活动
sudo journalctl -u blog-backend | grep -i "auth\|login\|token"
```

### 如果数据库泄露

1. **立即更改数据库密码**
2. **通知所有用户更改密码**
3. **审查数据访问日志**
4. **考虑重置所有密码哈希的salt**

## 📋 合规性检查

### GDPR/数据保护

- [ ] 用户数据加密存储
- [ ] 实现数据导出功能
- [ ] 实现数据删除功能
- [ ] 添加隐私政策
- [ ] 实现Cookie同意

### 日志和监控

- [ ] 不在日���中记录敏感信息（密码、令牌）
- [ ] 配置日志轮转
- [ ] 设置异常告警
- [ ] 监控认证失败次数

## 🔧 后端安全配置检查

### JWT配置
```go
// backend/config/config.go:69
JWT_SECRET 默认值: "JNU_technicians_club" ⚠️
建议: 使用环境变量，无默认值
```

### CORS配置
```go
// backend/main.go:82-86
开发环境: AllowAllOrigins = true ⚠️
生产环境: 使用 AllowedOrigins
```

### Rate Limiting
```go
// backend/config/config.go:209-211
生产环境限流: 60次/分钟, 1000次/小时 ✅
```

## 📝 审计日志

记录以下审计事件：
- [ ] 用户登录/登出
- [ ] 密码更改
- [ ] 权限变更
- [ ] 敏感数据访问
- [ ] API认证失败
- [ ] 文件上传

## 🎯 下一步行动

1. **立即执行**:
   - 清理Git历史
   - 更换JWT密钥
   - 配置生产环境变量

2. **部署时执行**:
   - 配置HTTPS
   - 设置防火墙
   - 配置数据库

3. **部署后验证**:
   - 运行安全测试
   - 检查日志
   - 监控性能
