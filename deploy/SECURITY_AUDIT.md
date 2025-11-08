# 安全漏洞审查报告

**生成时间**: 2025-11-07
**审查范围**: C404-blog 完整代码库
**严重性级别**: 🔴 严重 | 🟡 中等 | 🟢 低

---

## 执行摘要

在安全审查中发现 **7个主要安全漏洞**，其中 **2个严重漏洞** 需要立即修复。

### 严重性分布
- 🔴 严重: 2个
- 🟡 中等: 4个
- 🟢 低: 1个

---

## 🔴 严重漏洞

### 1. 硬编码的SMTP凭证 (Critical)

**位置**:
- `backend/services/auth.go:482-483`
- `backend/services/auth.go:522-523`
- `backend/graph/utils.go:237-238`
- `backend/graph/utils.go:268-269`

**问题描述**:
代码中硬编码了真实的邮箱账号和密码：
```go
smtpUsername = "xloudmaxx@gmail.com"
smtpPassword = "mbbf hrde wlpk bphe"  // 应用专用密码
```

**风险**:
- ❌ 任何能访问代码的人都能获取SMTP凭证
- ❌ 可以用此凭证发送钓鱼邮件
- ❌ 可能被滥用发送垃圾邮件
- ❌ 违反了最小权限原则

**影响范围**:
- 邮件发送功能
- 用户注册验证
- 密码重置功能

**修复建议**:
```go
// ❌ 错误做法
smtpUsername = "xloudmaxx@gmail.com"
smtpPassword = "mbbf hrde wlpk bphe"

// ✅ 正确做法
smtpUsername = os.Getenv("SMTP_USERNAME")
smtpPassword = os.Getenv("SMTP_PASSWORD")
if smtpUsername == "" || smtpPassword == "" {
    return errors.New("SMTP配置缺失")
}
```

**修复状态**: ⏳ 待修复

---

### 2. 硬编码的管理员邀请码 (Critical)

**位置**:
- `backend/services/auth.go:74`
- `backend/services/auth.go:433-444`

**问题描述**:
使用硬编码的特��邀请码 "realJNUtechnicians" 可以直接注册管理员账号：
```go
if input.InviteCode == "realJNUtechnicians" {
    role = "ADMIN"
}
```

**风险**:
- ❌ 任何人知道这个代码都可以注册管理员账号
- ❌ 代码已在Git仓库中公开
- ❌ 无法追踪谁使用了此邀请码
- ❌ 无法撤销此邀请码

**影响范围**:
- 用户注册系统
- 权限管理系统
- 整个应用的安全性

**修复建议**:
1. **立即**在生产环境禁用此特殊邀请码
2. 使用环境变量或数据库存储管理员邀请码
3. 添加使用日志和审计功能
4. 实现邀请码的过期机制

```go
// ✅ 正确做法
adminInviteCode := os.Getenv("ADMIN_INVITE_CODE")
if adminInviteCode != "" && input.InviteCode == adminInviteCode {
    role = "ADMIN"
    // 记录审计日志
    logger.Warnw("使用管理员邀请码注册", "username", input.Username, "email", input.Email)
}
```

**修复状态**: ⏳ 待修复

---

## 🟡 中等风险漏洞

### 3. 弱刷新令牌生成算法 (Medium)

**位置**:
- `backend/graph/schema.resolvers.go:45, 174, 189, 211`

**问题描述**:
刷新令牌使用简单的格式生成：
```go
refreshToken := fmt.Sprintf("refresh_%d_%d", user.ID, time.Now().Unix())
```

**风险**:
- ⚠️ 令牌格式可预测
- ⚠️ 容易被暴力破解
- ⚠️ 没有使用加密签名
- ⚠️ 时间戳可以被猜测

**修复建议**:
```go
// 生成安全的刷新令牌
func generateRefreshToken(userID uint) (string, error) {
    bytes := make([]byte, 32)
    if _, err := rand.Read(bytes); err != nil {
        return "", err
    }
    token := base64.URLEncoding.EncodeToString(bytes)

    // 存储到数据库并关联用户
    refreshToken := &RefreshToken{
        UserID: userID,
        Token: token,
        ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
    }
    db.Create(refreshToken)

    return token, nil
}
```

**修复状态**: ⏳ 待修复

---

### 4. 文件路径遍历漏洞 (Medium)

**位置**:
- `backend/services/file.go:65, 103`

**问题描述**:
文件名直接拼接到路径，没有充分清理：
```go
fullPath := filepath.Join(s.uploadDir, "images", filename)
```

**风险**:
- ⚠️ 可能通过 "../" 访问上级目录
- ⚠️ 可能覆盖系统文件
- ⚠️ 可能读取敏感文件

**攻击示例**:
```
filename = "../../etc/passwd"
fullPath = "/uploads/images/../../etc/passwd"  // 可能访问 /etc/passwd
```

**修复建议**:
```go
// 清理和验证文件名
func sanitizeFilename(filename string) (string, error) {
    // 移除路径分隔符
    clean := filepath.Base(filename)

    // 禁止 .. 和隐藏文件
    if strings.Contains(clean, "..") || strings.HasPrefix(clean, ".") {
        return "", errors.New("非法文件名")
    }

    // 只允许字母数字和安全字符
    if !regexp.MustCompile(`^[a-zA-Z0-9_.-]+$`).MatchString(clean) {
        return "", errors.New("文件名包含非法字符")
    }

    return clean, nil
}
```

**修复状态**: ⏳ 待修复

---

### 5. 弱密码策略 (Medium)

**位置**:
- `backend/services/auth.go:399`

**问题描述**:
密码强度要求过低：
```go
if len(input.Password) < 6 {
    return models.ErrPasswordTooWeak
}
```

**风险**:
- ⚠️ 6位密码容易被破解
- ⚠️ 没有要求字母+数字组合
- ⚠️ 没有防止常见弱密码

**修复建议**:
```go
func validatePasswordStrength(password string) error {
    if len(password) < 8 {
        return errors.New("密码至少需要8个字符")
    }

    hasUpper := regexp.MustCompile(`[A-Z]`).MatchString(password)
    hasLower := regexp.MustCompile(`[a-z]`).MatchString(password)
    hasNumber := regexp.MustCompile(`[0-9]`).MatchString(password)

    if !hasUpper || !hasLower || !hasNumber {
        return errors.New("密码必须包含大写字母、小写字母和数字")
    }

    // 检查常见弱密码
    commonPasswords := []string{"12345678", "password", "qwerty123"}
    for _, common := range commonPasswords {
        if strings.ToLower(password) == common {
            return errors.New("密码过于常见，请使用更强的密码")
        }
    }

    return nil
}
```

**修复状态**: ⏳ 待修复

---

### 6. 内存验证码存储 (Medium)

**位置**:
- `backend/graph/utils.go:290-327`

**问题描述**:
验证码存储在内存map中：
```go
var verificationCodes = make(map[string]*VerificationCode)
```

**风险**:
- ⚠️ 服务重启后验证码丢失
- ⚠️ 无法在多实例环境中共享
- ⚠️ 没有持久化存储
- ⚠️ 占用内存且无上限

**修复建议**:
使用Redis或数据库存储验证码：
```go
// 使用Redis存储
func storeVerificationCode(email, code string) error {
    key := fmt.Sprintf("verification:%s", email)
    return redisClient.Set(ctx, key, code, 10*time.Minute).Err()
}

// 或使用数据库
type EmailVerification struct {
    Email     string `gorm:"primaryKey"`
    Code      string
    ExpiresAt time.Time
    CreatedAt time.Time
}
```

**修复状态**: ⏳ 待修复

---

## 🟢 低风险问题

### 7. 文件大小检查被跳过 (Low)

**位置**:
- `backend/services/file.go:57-58`

**问题描述**:
```go
// 验证文件大小 - 简化实现，跳过文件大小检查
// 在实际项目中可以通过读取部分文件内容来检查大小
```

**风险**:
- ⚠️ 可能导致DoS攻击（上传超大文件）
- ⚠️ 服务器磁盘空间耗尽

**修复建议**:
```go
// 限制文件大小
if file.Size > s.maxSize {
    return nil, fmt.Errorf("文件大小超过限制（%d MB）", s.maxSize/(1024*1024))
}
```

**修复状态**: ⏳ 待修复

---

## 其他安全建议

### 1. SQL注入防护 ✅
使用GORM的参数化查询，已正确防护SQL注入：
```go
db.Where("email = ?", email).First(&user)  // ✅ 安全
```

### 2. XSS防护 ✅
React自动转义输出，前端已有基础防护。

### 3. CSRF防护 ⚠️
建议在重要操作添加CSRF Token验证。

### 4. Rate Limiting ✅
已实现限流中间件，建议调低阈值。

### 5. 日志安全 ⚠️
避免在日志中记录敏感信息（密码、token等）。

### 6. HTTPS ❌
生产环境必须启用HTTPS。

### 7. 安全响应头 ⚠️
nginx配置中已添加基础安全头，建议添加CSP。

---

## 修复优先级

### 🔴 立即修复（1-2天内）
1. 移除硬编码的SMTP凭证
2. 禁用/更改硬编码管理员邀请码

### 🟡 近期修复（1周内）
3. 实现安全的刷新令牌机制
4. 修复文件路径遍历漏洞
5. 加强密码强度要求
6. 实现验证码持久化存储
7. 实现文件大小验证

### 🟢 后续改进
- 添加CSRF防护
- 实现审计日志
- 添加安全监控和告警
- 定期安全审计

---

## 修复验证清单

修复后需要验证：

- [ ] 所有敏感信息已从代码中移除
- [ ] 环境变量已正确配置
- [ ] 测试所有受影响的功能
- [ ] 更新部署文档
- [ ] 进行渗透测试
- [ ] 审查git历史中的敏感信息

---

## 附录

### 安全测试命令

```bash
# 1. 测试路径遍历
curl -F "file=@../../../etc/passwd" http://localhost:11451/upload

# 2. 测试刷新令牌预测
# 尝试猜测格式: refresh_{userID}_{timestamp}

# 3. 测试弱密码
curl -X POST http://localhost:11451/graphql \\
  -d '{"query": "mutation { register(input: {username: \"test\", password: \"123456\", email: \"test@test.com\"}) { token } }"}'

# 4. 测试管理员邀请码
curl -X POST http://localhost:11451/graphql \\
  -d '{"query": "mutation { register(input: {username: \"admin\", password: \"password\", email: \"admin@test.com\", inviteCode: \"realJNUtechnicians\"}) { token } }"}'
```

### 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Go Security Best Practices](https://golang.org/doc/security/)

---

**审查人**: Claude Code
**下次审查时间**: 建议每季度进行一次安全审查
