#!/bin/bash
set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 博客平台部署脚本 ===${NC}"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}请使用 sudo 运行此脚本${NC}"
    exit 1
fi

# 配置变量
DEPLOY_USER="www-data"
APP_DIR="/var/www/blog"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/dist"
CURRENT_DIR=$(pwd)

# 步骤1: 安装依赖
echo -e "${YELLOW}步骤 1/9: 安装系统依赖...${NC}"
apt update
apt install -y nginx postgresql postgresql-contrib golang-go git

# 步骤2: 设置PostgreSQL数据库
echo -e "${YELLOW}步骤 2/9: 配置PostgreSQL数据库...${NC}"
sudo -u postgres psql -c "CREATE DATABASE blog_platform;" || echo "数据库已存在"
sudo -u postgres psql -c "CREATE USER blog_user WITH PASSWORD 'CHANGE_THIS_PASSWORD';" || echo "用户已存在"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE blog_platform TO blog_user;"
sudo -u postgres psql -d blog_platform -c "GRANT ALL ON SCHEMA public TO blog_user;"

# 步骤3: 创建应用目录
echo -e "${YELLOW}步骤 3/9: 创建应用目录...${NC}"
mkdir -p $APP_DIR
mkdir -p $BACKEND_DIR
mkdir -p $FRONTEND_DIR
mkdir -p $BACKEND_DIR/uploads
mkdir -p $BACKEND_DIR/bin

# 步骤4: 构建后端
echo -e "${YELLOW}步骤 4/9: 构建后端应用...${NC}"
cd $CURRENT_DIR/backend
go mod download
go build -o bin/server main.go

# 步骤5: 复制后端文件
echo -e "${YELLOW}步骤 5/9: 部署后端文件...${NC}"
cp -r bin $BACKEND_DIR/
cp -r graph $BACKEND_DIR/
cp .env.production $BACKEND_DIR/.env

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me || echo "YOUR_SERVER_IP")
echo -e "${GREEN}检测到服务器IP: $SERVER_IP${NC}"

# 更新后端.env配置
sed -i "s/YOUR_SERVER_IP/$SERVER_IP/g" $BACKEND_DIR/.env
sed -i "s/CHANGE_THIS_PASSWORD/$(openssl rand -base64 16)/g" $BACKEND_DIR/.env

echo -e "${YELLOW}请手动编辑 $BACKEND_DIR/.env 以设置正确的数据库密码${NC}"

# 步骤6: 构建和部署前端
echo -e "${YELLOW}步骤 6/9: 构建前端应用...${NC}"
cd $CURRENT_DIR

# 更新前端环境变量
echo "VITE_API_BASE_URL=http://$SERVER_IP/" > .env.production

# 安装pnpm（如果未安装）
if ! command -v pnpm &> /dev/null; then
    echo "安装 pnpm..."
    npm install -g pnpm
fi

# 构建前端
pnpm install
pnpm build

# 部署前端
cp -r dist/* $FRONTEND_DIR/

# 步骤7: 设置权限
echo -e "${YELLOW}步骤 7/9: 设置文件权限...${NC}"
chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR
chmod -R 755 $APP_DIR
chmod +x $BACKEND_DIR/bin/server

# 步骤8: 配置systemd服务
echo -e "${YELLOW}步骤 8/9: 配置systemd服务...${NC}"
cp $CURRENT_DIR/deploy/systemd/blog-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable blog-backend
systemctl start blog-backend
systemctl status blog-backend --no-pager

# 步骤9: 配置nginx
echo -e "${YELLOW}步骤 9/9: 配置nginx...${NC}"
sed "s/YOUR_SERVER_IP/$SERVER_IP/g" $CURRENT_DIR/deploy/nginx/blog.conf > /etc/nginx/sites-available/blog
ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试nginx配置
nginx -t

# 重启nginx
systemctl restart nginx
systemctl status nginx --no-pager

echo -e "${GREEN}=== 部署完成！ ===${NC}"
echo -e "${GREEN}访问地址: http://$SERVER_IP${NC}"
echo -e "${YELLOW}后续步骤:${NC}"
echo -e "1. 检查后端日志: sudo journalctl -u blog-backend -f"
echo -e "2. 检查nginx日志: sudo tail -f /var/log/nginx/blog_error.log"
echo -e "3. 配置防火墙: sudo ufw allow 80/tcp"
echo -e "4. (可选) 配置HTTPS: sudo certbot --nginx -d yourdomain.com"
echo -e "5. 修改数据库密码: 编辑 $BACKEND_DIR/.env"
