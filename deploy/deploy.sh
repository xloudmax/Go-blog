#!/bin/bash
set -e
export PATH=$PATH:/usr/local/go/bin

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 博客平台部署脚本 (SQLite版) ===${NC}"

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
DATA_DIR="$BACKEND_DIR/data"
CURRENT_DIR=$(pwd)

# 步骤1: 安装依赖
echo -e "${YELLOW}步骤 1/7: 安装系统依赖...${NC}"
apt update
apt install -y nginx git

# 步骤2: 创建应用目录
echo -e "${YELLOW}步骤 2/7: 创建应用目录...${NC}"
mkdir -p $APP_DIR
mkdir -p $BACKEND_DIR
mkdir -p $FRONTEND_DIR
mkdir -p $BACKEND_DIR/uploads
mkdir -p $BACKEND_DIR/bin
mkdir -p $DATA_DIR

# 步骤3: 构建后端
echo -e "${YELLOW}步骤 3/7: 构建后端应用...${NC}"
cd $CURRENT_DIR/backend
go mod download
go build -tags fts5 -o bin/server main.go
# 编译管理员创建工具
mkdir -p bin/tools
go build -o bin/tools/create_admin cmd/create_admin/main.go

# 步骤4: 复制后端文件
echo -e "${YELLOW}步骤 4/7: 部署后端文件...${NC}"
# 停止服务以允许覆盖二进制文件
systemctl stop blog-backend || true
cp -r bin $BACKEND_DIR/
cp -r graph $BACKEND_DIR/

#处理数据库
DB_FILE="blog_production.db"
DB_PATH="$DATA_DIR/$DB_FILE"

if [ -f "$DB_PATH" ]; then
    echo -e "${YELLOW}检测到现有数据库，正在备份...${NC}"
    mv "$DB_PATH" "$DB_PATH.bak.$(date +%Y%m%d%H%M%S)"
fi

echo "DEBUG: Content of source .env.production:"
cat .env.production
echo "DEBUG: Removing destination .env"
rm -f $BACKEND_DIR/.env
echo "DEBUG: Copying .env.production to destination"
cp .env.production $BACKEND_DIR/.env
chmod 600 $BACKEND_DIR/.env
ls -l $BACKEND_DIR/.env
echo "DEBUG: Content of destination .env:"
cat $BACKEND_DIR/.env

# 获取服务器IP
SERVER_IP=$(curl -s ifconfig.me || echo "YOUR_SERVER_IP")
echo -e "${GREEN}检测到服务器IP: $SERVER_IP${NC}"

# 更新后端.env配置
# 必须显式设置 DATABASE_URL 指向 data 目录下的数据库文件
sed -i "s/YOUR_SERVER_IP/$SERVER_IP/g" $BACKEND_DIR/.env
# 更新 DATABASE_URL 为绝对路径，确保应用能找到
sed -i "s|DATABASE_URL=.*|DATABASE_URL=$DB_PATH|g" $BACKEND_DIR/.env
# 设置允许的文件类型，包含图片格式
echo "ALLOWED_FILE_TYPES=.md,.txt,.json,.jpg,.jpeg,.png,.gif,.webp" >> $BACKEND_DIR/.env

# 步骤5: 构建和部署前端
echo -e "${YELLOW}步骤 5/7: 构建前端应用...${NC}"
cd $CURRENT_DIR

# 更新前端环境变量
echo "VITE_API_BASE_URL=https://xloudmax.cc/" > .env.production.local

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

# 步骤6: 设置权限
echo -e "${YELLOW}步骤 6/7: 设置文件权限...${NC}"
chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR
chmod -R 755 $APP_DIR
# 确保数据目录可写
chmod -R 775 $DATA_DIR
# 确保数据库文件所在目录可写（SQLite 需要在目录中创建临时文件）
chown -R $DEPLOY_USER:$DEPLOY_USER $DATA_DIR
chmod -R 775 $DATA_DIR
# 确保上传目录可写
chown -R $DEPLOY_USER:$DEPLOY_USER $BACKEND_DIR/uploads
chmod -R 775 $BACKEND_DIR/uploads

chmod +x $BACKEND_DIR/bin/server
chmod +x $BACKEND_DIR/bin/tools/create_admin

# 步骤7: 配置systemd服务
echo -e "${YELLOW}步骤 7/7: 配置systemd服务...${NC}"
cp $CURRENT_DIR/deploy/systemd/blog-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable blog-backend
systemctl restart blog-backend
systemctl status blog-backend --no-pager

# 配置nginx
echo -e "${YELLOW}配置nginx...${NC}"
sed "s/YOUR_SERVER_IP/$SERVER_IP/g" $CURRENT_DIR/deploy/nginx/blog.conf > /etc/nginx/sites-available/blog
ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试nginx配置
nginx -t

# 重启nginx
systemctl restart nginx
systemctl status nginx --no-pager

# 创建管理员账号
echo -e "${YELLOW}创建管理员账号...${NC}"
cd $BACKEND_DIR
# 确保使用www-data权限运行以保证文件权限正确
# 我们需要传递环境变量，特别是 DATABASE_URL
sudo -u $DEPLOY_USER DATABASE_URL=$DB_PATH ./bin/tools/create_admin

echo -e "${GREEN}=== 部署完成！ ===${NC}"
echo -e "${GREEN}访问地址: http://$SERVER_IP${NC}"
echo -e "${GREEN}管理员账号: admin / admin123${NC}"
echo -e "${YELLOW}请登录后立即修改密码！${NC}"
