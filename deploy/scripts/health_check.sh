#!/bin/bash
# 应用健康检查脚本

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_service() {
    SERVICE=$1
    if systemctl is-active --quiet $SERVICE; then
        echo -e "${GREEN}✅ $SERVICE 运行正常${NC}"
        return 0
    else
        echo -e "${RED}❌ $SERVICE 未运行${NC}"
        return 1
    fi
}

check_port() {
    PORT=$1
    NAME=$2
    if netstat -tlnp 2>/dev/null | grep -q ":$PORT "; then
        echo -e "${GREEN}✅ $NAME (端口 $PORT) 正在监听${NC}"
        return 0
    else
        echo -e "${RED}❌ $NAME (端口 $PORT) 未监听${NC}"
        return 1
    fi
}

check_url() {
    URL=$1
    NAME=$2
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $URL 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
        echo -e "${GREEN}✅ $NAME 响应正常 (HTTP $HTTP_CODE)${NC}"
        return 0
    else
        echo -e "${RED}❌ $NAME 无响应或错误 (HTTP $HTTP_CODE)${NC}"
        return 1
    fi
}

echo "==================== 系统健康检查 ===================="
echo ""

# 检查系统资源
echo "--- 系统资源 ---"
echo "CPU使用率: $(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}')"
echo "内存使用: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "磁盘使用: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"
echo ""

# 检查服务状态
echo "--- 服务状态 ---"
check_service blog-backend
check_service nginx
check_service postgresql
echo ""

# 检查端口监听
echo "--- 端口检查 ---"
check_port 80 "HTTP (nginx)"
check_port 11451 "后端API"
check_port 5432 "PostgreSQL"
echo ""

# 检查应用响应
echo "--- 应用响应检查 ---"
check_url "http://localhost" "前端页面"
check_url "http://localhost:11451/graphql" "GraphQL API"
echo ""

# 检查最近的错误日志
echo "--- 最近错误日志 ---"
echo "后端错误（最近5条）:"
sudo journalctl -u blog-backend -p err -n 5 --no-pager 2>/dev/null || echo "无错误日志"
echo ""

echo "nginx错误（最近5条）:"
sudo tail -n 5 /var/log/nginx/blog_error.log 2>/dev/null || echo "无错误日志"
echo ""

# 检查磁盘空间
echo "--- 磁盘空间警告 ---"
df -h | awk 'NR>1 {gsub(/%/,"",$5); if($5>80) print "⚠️  " $6 " 使用率: " $5"%"}'
echo ""

# 检查数据库连接
echo "--- 数据库连接 ---"
if sudo -u postgres psql -d blog_platform -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 数据库连接正常${NC}"
    DB_SIZE=$(sudo -u postgres psql -d blog_platform -c "SELECT pg_size_pretty(pg_database_size('blog_platform'));" -t | xargs)
    echo "数据库大小: $DB_SIZE"
else
    echo -e "${RED}❌ 数据库连接失败${NC}"
fi
echo ""

echo "==================== 检查完成 ===================="
