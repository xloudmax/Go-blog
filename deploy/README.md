# 博客平台快速部署指南

## 🚀 5分钟快速部署

### 前提条件
- Ubuntu 20.04+ 服务器
- root或sudo权限
- 至少2GB内存

### 快速开始

```bash
# 1. 克隆代码（如果还没有）
git clone <your-repo-url>
cd C404-blog

# 2. 清理敏感文件（重要！）
# 如果.env和.db文件已提交到git，需要清理历史
# 详见 deploy/SECURITY_CHECKLIST.md

# 3. 运行一键部署脚本
sudo ./deploy/deploy.sh
```

脚本会自动完成所有配置，完成后访问 `http://YOUR_SERVER_IP`

### 部署后配置

1. **修改数据库密码**
```bash
# 生成强密码
DB_PASSWORD=$(openssl rand -base64 24)
echo $DB_PASSWORD

# 更新PostgreSQL用户密码
sudo -u postgres psql -c "ALTER USER blog_user WITH PASSWORD '$DB_PASSWORD';"

# 更新.env配置
sudo nano /var/www/blog/backend/.env
# 修改 DATABASE_URL 中的密码

# 重启服务
sudo systemctl restart blog-backend
```

2. **配置域名（可选）**
```bash
# 更新nginx配置
sudo nano /etc/nginx/sites-available/blog
# 将 YOUR_SERVER_IP 替换为你的域名

# 重启nginx
sudo nginx -t && sudo systemctl reload nginx
```

3. **配置HTTPS（推荐）**
```bash
# 安装certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d yourdomain.com
```

## 📁 部署文件结构

```
deploy/
├── deploy.sh                 # 一键部署脚本
├── DEPLOYMENT.md            # 详细部署文档
├── SECURITY_CHECKLIST.md    # 安全检查清单
├── nginx/
│   └── blog.conf           # Nginx配置
├── systemd/
│   └── blog-backend.service # Systemd服务配置
└── scripts/
    ├── backup_db.sh        # 数据库备份
    ├── restore_db.sh       # 数据库恢复
    └── health_check.sh     # 健康检查
```

## 🔧 常用命令

### 服务管理
```bash
# 查看后端状态
sudo systemctl status blog-backend

# 重启后端
sudo systemctl restart blog-backend

# 查看后端日志
sudo journalctl -u blog-backend -f

# 重启nginx
sudo systemctl reload nginx
```

### 数据库管理
```bash
# 备份数据库
sudo ./deploy/scripts/backup_db.sh

# 恢复数据库
sudo ./deploy/scripts/restore_db.sh /var/backups/blog/blog_db_xxx.sql.gz

# 连接数据库
sudo -u postgres psql -d blog_platform
```

### 健康检查
```bash
# 运行健康检查
sudo ./deploy/scripts/health_check.sh
```

### 更新部署
```bash
# 拉取最新代码
git pull

# 重新构建后端
cd backend && go build -o bin/server main.go
sudo systemctl restart blog-backend

# 重新构建前端
pnpm build
sudo cp -r dist/* /var/www/blog/dist/
```

## 🔒 安全注意事项

### 必须立即完成

1. ✅ **清理Git历史中的敏感文件**
   ```bash
   # 使用git-filter-repo
   pip3 install git-filter-repo
   git filter-repo --path backend/.env --invert-paths
   git filter-repo --path '*.db' --invert-paths
   ```

2. ✅ **更换JWT密钥**
   - 已在 `backend/.env.production` 中生成
   - 确保不使用默认密钥

3. ✅ **设置强数据库密码**
   - 参见上面"部署后配置"

4. ✅ **配置防火墙**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

### 推荐配置

- [ ] 配置HTTPS
- [ ] 设置自动备份cron任务
- [ ] 配置fail2ban
- [ ] 启用邮件通知

## 📊 监控和维护

### 设置自动备份（推荐）

```bash
# 添加到crontab
sudo crontab -e

# 每天凌晨2点备份
0 2 * * * /var/www/blog/deploy/scripts/backup_db.sh >> /var/log/blog_backup.log 2>&1
```

### 日志管理

```bash
# 查看nginx访问日志
sudo tail -f /var/log/nginx/blog_access.log

# 查看nginx错误日志
sudo tail -f /var/log/nginx/blog_error.log

# 查看后端日志
sudo journalctl -u blog-backend -f

# 查看数据库日志
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### 性能监控

```bash
# 查看系统资源
htop

# 查看nginx状态
sudo systemctl status nginx

# 查看数据库连接
sudo -u postgres psql -d blog_platform -c "SELECT count(*) FROM pg_stat_activity;"
```

## 🆘 故障排查

### 后端无法启动

```bash
# 检查配置文件
cat /var/www/blog/backend/.env

# 查看详细错误
sudo journalctl -u blog-backend -n 100

# 检查端口占用
sudo lsof -i :11451

# 测试数据库连接
sudo -u postgres psql -d blog_platform -c "SELECT 1;"
```

### 前端无法访问

```bash
# 检查nginx配置
sudo nginx -t

# 查看nginx日志
sudo tail -f /var/log/nginx/blog_error.log

# 检查前端文件
ls -la /var/www/blog/dist/
```

### 数据库连接失败

```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 检查连接字符串
grep DATABASE_URL /var/www/blog/backend/.env

# 测试连接
sudo -u postgres psql -d blog_platform
```

## 📚 更多文档

- [详细部署文档](./DEPLOYMENT.md)
- [安全检查清单](./SECURITY_CHECKLIST.md)
- [项目说明](../CLAUDE.md)

## 🎯 下一步

部署成功后，建议：

1. 创建管理员账号
2. 配置邮件服务（可选）
3. 设置自动备份
4. 配置监控告警
5. 编写第一篇博客！

---

**遇到问题?** 查看详细文档或检查日志文件
