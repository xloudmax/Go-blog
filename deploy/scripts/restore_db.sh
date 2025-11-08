#!/bin/bash
# 数据库恢复脚本

set -e

# 检查参数
if [ $# -ne 1 ]; then
    echo "用法: $0 <backup_file.sql.gz>"
    echo "示例: $0 /var/backups/blog/blog_db_20250101_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1
DB_NAME="blog_platform"
DB_USER="blog_user"

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

# 确认操作
read -p "⚠️  这将覆盖当前数据库 $DB_NAME，是否继续? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "操作已取消"
    exit 0
fi

# 停止后端服务
echo "停止后端服务..."
sudo systemctl stop blog-backend

# 恢复数据库
echo "开始恢复数据库..."
gunzip < $BACKUP_FILE | sudo -u postgres psql $DB_NAME

# 检查恢复结果
if [ $? -eq 0 ]; then
    echo "✅ 数据库恢复成功"
else
    echo "❌ 数据库恢复失败"
    exit 1
fi

# 重启后端服务
echo "重启后端服务..."
sudo systemctl start blog-backend
sudo systemctl status blog-backend --no-pager

echo "✅ 恢复完成"
