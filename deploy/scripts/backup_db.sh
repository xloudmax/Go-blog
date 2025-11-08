#!/bin/bash
# 数据库备份脚本

set -e

# 配置
BACKUP_DIR="/var/backups/blog"
DB_NAME="blog_platform"
DB_USER="blog_user"
RETENTION_DAYS=7

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份文件名（包含日期时间）
BACKUP_FILE="$BACKUP_DIR/blog_db_$(date +%Y%m%d_%H%M%S).sql.gz"

# 执行备份
echo "开始备份数据库..."
sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_FILE

# 检查备份是否成功
if [ -f "$BACKUP_FILE" ]; then
    echo "✅ 备份成功: $BACKUP_FILE"
    echo "文件大小: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "❌ 备份失败"
    exit 1
fi

# 删除旧备份（保留最近N天）
echo "清理旧备份文件（保留${RETENTION_DAYS}天）..."
find $BACKUP_DIR -name "blog_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# 显示当前备份列表
echo "当前备份文件:"
ls -lh $BACKUP_DIR/blog_db_*.sql.gz 2>/dev/null || echo "无备份文件"

echo "✅ 备份任务完成"
