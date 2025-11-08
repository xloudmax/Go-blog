# 博客平台生产部署指南

## 🚨 部署前安全检查清单

### 1. Git历史清理（重要！）

你的git仓库包含敏感文件（.env和.db），需要清理历史记录：

```bash
# 方法1: 使用git-filter-repo（推荐）
# 安装: pip3 install git-filter-repo
git filter-repo --path backend/.env --invert-paths
git filter-repo --path backend/blog_platform.db --invert-paths
git filter-repo --path backend/data.db --invert-paths
git filter-repo --path blog_platform.db --invert-paths

# 方法2: 使用BFG Repo-Cleaner
# 下载: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files '.env'
java -jar bfg.jar --delete-files '*.db'
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 强制推送（警告：会覆盖远程历史）
git push origin --force --all
```

### 2. 环境变量配置

编辑生产环境配置文件：

#### 后端配置 (`backend/.env.production`)
```bash
# 必须修改的配置：
- JWT_SECRET: 已生成强随机密钥
- DATABASE_URL: 设置PostgreSQL连接字符串
- ALLOWED_ORIGINS: 设置你的域名或IP
- BASE_URL: 设置你的API地址
- SMTP配置: 如需邮件功能
```

#### 前端配置 (`.env.production`)
```bash
VITE_API_BASE_URL=http://YOUR_SERVER_IP:11451/
```

## 📦 一键部署

### 自动部署（推荐）

```bash
# 在项目根目录执行
sudo ./deploy/deploy.sh
```

该脚本会自动：
1. 安装系统依赖（nginx、PostgreSQL、Go）
2. 配置PostgreSQL数据库
3. 构建后端应用
4. 构建前端应用
5. 配置systemd服务
6. 配置nginx反向代理
7. 启动所有服务

### 手动部署

如果自动部署失败，可以按以下步骤手动部署：

#### 步骤1: 安装依赖
```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib golang-go git nodejs npm
npm install -g pnpm
```

#### 步骤2: 配置PostgreSQL
```bash
# 切换到postgres用户
sudo -u postgres psql

# 在psql中执行
CREATE DATABASE blog_platform;
CREATE USER blog_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE blog_platform TO blog_user;
\c blog_platform
GRANT ALL ON SCHEMA public TO blog_user;
\q
```

#### 步骤3: 更新配置文件
```bash
# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me)

# 更新后端配置
cd backend
cp .env.production .env
# 编辑.env，替换以下内容：
# - YOUR_SERVER_IP -> 实际IP
# - DATABASE_URL中的密码
# - JWT_SECRET（已自动生成）
nano .env

# 更新前端配置
cd ..
echo "VITE_API_BASE_URL=http://$SERVER_IP:11451/" > .env.production
```

#### 步骤4: 构建应用
```bash
# 构建后端
cd backend
go mod download
go build -o bin/server main.go

# 构建前端
cd ..
pnpm install
pnpm build
```

#### 步骤5: 部署文件
```bash
# 创建应用目录
sudo mkdir -p /var/www/blog/backend
sudo mkdir -p /var/www/blog/dist

# 复制后端
sudo cp -r backend/bin /var/www/blog/backend/
sudo cp -r backend/graph /var/www/blog/backend/
sudo cp backend/.env /var/www/blog/backend/
sudo mkdir -p /var/www/blog/backend/uploads

# 复制前端
sudo cp -r dist/* /var/www/blog/dist/

# 设置权限
sudo chown -R www-data:www-data /var/www/blog
sudo chmod -R 755 /var/www/blog
sudo chmod +x /var/www/blog/backend/bin/server
```

#### 步骤6: 配置systemd服务
```bash
# 复制服务文件
sudo cp deploy/systemd/blog-backend.service /etc/systemd/system/

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable blog-backend
sudo systemctl start blog-backend

# 检查状态
sudo systemctl status blog-backend
```

#### 步骤7: 配置nginx
```bash
# 获取服务器IP并更新配置
SERVER_IP=$(curl -s ifconfig.me)
sed "s/YOUR_SERVER_IP/$SERVER_IP/g" deploy/nginx/blog.conf | sudo tee /etc/nginx/sites-available/blog

# 启用站点
sudo ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启nginx
sudo systemctl restart nginx
```

#### 步骤8: 配置防火墙
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 🔒 HTTPS配置（推荐）

### 使用Let's Encrypt（免费）

```bash
# 安装certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书（需要先配置域名DNS）
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

配置成功后，需要更新：
1. `backend/.env` 的 `ALLOWED_ORIGINS` 和 `BASE_URL` 改为https
2. `.env.production` 的 `VITE_API_BASE_URL` 改为https
3. 重新构建前端并部署

## 🔍 故障排查

### 检查后端状态
```bash
# 查看服务状态
sudo systemctl status blog-backend

# 查看实时日志
sudo journalctl -u blog-backend -f

# 查看最近的错误
sudo journalctl -u blog-backend -p err
```

### 检查nginx状态
```bash
# 查看nginx状态
sudo systemctl status nginx

# 查看错误日志
sudo tail -f /var/log/nginx/blog_error.log

# 查看访问日志
sudo tail -f /var/log/nginx/blog_access.log
```

### 检查数据库连接
```bash
# 测试PostgreSQL连接
sudo -u postgres psql -d blog_platform -c "SELECT version();"

# 检查数据库权限
sudo -u postgres psql -d blog_platform -c "\du"
```

### 常见问题

#### 1. 后端无法启动
- 检查数据库连接：`DATABASE_URL` 配置是否正确
- 检查端口占用：`sudo lsof -i :11451`
- 查看详细日志：`sudo journalctl -u blog-backend -n 50`

#### 2. 前端无法访问后端
- 检查CORS配置：`ALLOWED_ORIGINS` 是否包含前端地址
- 检查nginx代理：`sudo nginx -t`
- 检查防火墙：`sudo ufw status`

#### 3. 数据库连接失败
- 检查PostgreSQL状态：`sudo systemctl status postgresql`
- 检查数据库密码：确保.env中的密码与PostgreSQL用户密码一致
- 检查pg_hba.conf：`sudo nano /etc/postgresql/*/main/pg_hba.conf`

## 🚀 更新部署

当代码更新后，使用以下命令重新部署：

```bash
# 拉取最新代码
git pull

# 重新构建后端
cd backend
go build -o bin/server main.go
sudo cp bin/server /var/www/blog/backend/bin/
sudo systemctl restart blog-backend

# 重新构建前端
cd ..
pnpm build
sudo cp -r dist/* /var/www/blog/dist/
```

## 📊 性能优化建议

1. **数据库优化**
   - 配置PostgreSQL连接池
   - 添加适当的索引
   - 定期VACUUM

2. **nginx优化**
   - 启用gzip压缩
   - 配置缓存
   - 使用HTTP/2

3. **应用优化**
   - 启用GraphQL查询缓存
   - 使用CDN加速静态资源
   - 配置Redis缓存

## 🔐 安全加固建议

1. **系统安全**
   - 禁用root登录
   - 配置fail2ban
   - 定期更新系统

2. **应用安全**
   - 使用强JWT密钥
   - 启用rate limiting
   - 配置CSP头部
   - 定期备份数据库

3. **网络安全**
   - 使用HTTPS
   - 配置防火墙规则
   - 隐藏nginx版本信息

## 📝 维护任务

### 每日
- 检查应用日志
- 监控资源使用

### 每周
- 备份数据库
- 检查系统更新

### 每月
- 分析访问日志
- 清理旧日志文件
- 审查安全配置
