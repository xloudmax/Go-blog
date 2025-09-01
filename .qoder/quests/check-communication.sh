#!/bin/bash

# 前后端通信状态检查脚本

echo "========================================="
echo "    前后端通信状态检查工具"
echo "========================================="

BACKEND_URL="http://localhost:11451"
FRONTEND_URL="http://localhost:5173"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查后端服务
echo "1. 检查后端服务状态..."
if curl -s --head --request GET $BACKEND_URL/health/ping | grep "200 OK" > /dev/null; then
    echo -e "   ${GREEN}✅ 后端服务正常运行${NC}"
    BACKEND_STATUS=true
else
    echo -e "   ${RED}❌ 后端服务未运行或无法访问${NC}"
    BACKEND_STATUS=false
fi

# 检查数据库连接
echo "2. 检查数据库连接状态..."
if curl -s $BACKEND_URL/health/db | grep "database is healthy" > /dev/null; then
    echo -e "   ${GREEN}✅ 数据库连接正常${NC}"
    DB_STATUS=true
else
    echo -e "   ${RED}❌ 数据库连接异常${NC}"
    DB_STATUS=false
fi

# 检查GraphQL端点
echo "3. 检查GraphQL端点..."
GRAPHQL_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __typename }"}' \
  $BACKEND_URL/graphql)

if echo $GRAPHQL_RESPONSE | grep "__typename" > /dev/null; then
    echo -e "   ${GREEN}✅ GraphQL端点正常${NC}"
    GRAPHQL_STATUS=true
else
    echo -e "   ${RED}❌ GraphQL端点异常${NC}"
    echo "   响应内容: $GRAPHQL_RESPONSE"
    GRAPHQL_STATUS=false
fi

# 检查GraphQL Schema
echo "4. 检查GraphQL Schema..."
SCHEMA_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name } } }"}' \
  $BACKEND_URL/graphql)

if echo $SCHEMA_RESPONSE | grep "__schema" > /dev/null; then
    echo -e "   ${GREEN}✅ GraphQL Schema可访问${NC}"
    SCHEMA_STATUS=true
else
    echo -e "   ${RED}❌ GraphQL Schema访问异常${NC}"
    SCHEMA_STATUS=false
fi

# 检查健康检查GraphQL端点
echo "5. 检查健康检查GraphQL端点..."
HEALTH_GRAPHQL_RESPONSE=$(curl -s $BACKEND_URL/health/graphql)

if echo $HEALTH_GRAPHQL_RESPONSE | grep "GraphQL endpoint is available" > /dev/null; then
    echo -e "   ${GREEN}✅ GraphQL健康检查端点正常${NC}"
    HEALTH_GRAPHQL_STATUS=true
else
    echo -e "   ${RED}❌ GraphQL健康检查端点异常${NC}"
    HEALTH_GRAPHQL_STATUS=false
fi

# 检查前端开发服务器
echo "6. 检查前端开发服务器..."
if curl -s --head --request GET $FRONTEND_URL | grep "200 OK" > /dev/null; then
    echo -e "   ${GREEN}✅ 前端开发服务器正常运行${NC}"
    FRONTEND_STATUS=true
else
    echo -e "   ${RED}❌ 前端开发服务器未运行或无法访问${NC}"
    FRONTEND_STATUS=false
fi

echo ""
echo "========================================="
echo "               检查结果汇总"
echo "========================================="

if [ "$BACKEND_STATUS" = true ] && [ "$DB_STATUS" = true ] && [ "$GRAPHQL_STATUS" = true ] && [ "$SCHEMA_STATUS" = true ] && [ "$HEALTH_GRAPHQL_STATUS" = true ] && [ "$FRONTEND_STATUS" = true ]; then
    echo -e "${GREEN}🎉 前后端通信正常！所有服务都在正常运行。${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  存在通信问题，请检查上述错误信息。${NC}"
    exit 1
fi