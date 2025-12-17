# C404-blog 系统全方位分析报告

经过对 C404-blog 项目的深度分析，我发现了以下几个关键领域的潜在 Bug、性能瓶颈和优化点。

## 1. 核心 Bug 与风险 (Critical/High)

### 1.1 `Posts` 查询的 N+1 问题与数据缺失
**位置**: `backend/graph/schema.resolvers.go` 中的 `Posts` 解析器。
**问题描述**: 
在查询文章列表时，代码只执行了 `dbQuery.Find(&posts)`，**没有使用了 `Preload("Author")`**。
然而，GraphQL Schema 定义 `BlogPost.author` 为 `User!` (非空)。
在 `backend/graph/utils.go` 的 `convertToGraphQLBlogPostWithUser` 函数中，因为 `post.Author` 结构体未被加载（为空值），导致转换后的 `author` 字段为 `nil`。
**后果**: 
-   如果 GraphQL 执行引擎严格校验非空，查询将直接报错 "Cannot return null for non-nullable field User"。
-   如果碰巧不报错，前端收到的 Author 信息将为空。
-   即使 GORM 配置了自动懒加载（Auto Preload），也会触发严重的 N+1 查询问题（每篇文章查询一次用户表）。

### 1.2 搜索性能隐患
**位置**: `backend/graph/schema.resolvers.go` 中的 `EnhancedSearch` 和 `Posts` 过滤逻辑。
**问题描述**:
搜索功能使用了 SQL 的 `LIKE %keyword%` 语法：
```go
dbQuery.Where("(title LIKE ? OR content LIKE ? OR tags LIKE ? ...)")
```
**后果**:
-   `LIKE %...%` 会导致数据库进行**全表扫描**，无法利用索引。随着文章数量增加，搜索接口响应时间将呈线性甚至指数级增长，最终导致超时。

## 2. 架构与设计优化 (Architecture)

### 2.1 标签与分类的非规范化存储
**位置**: `backend/models/blogPost.go`
**问题描述**:
`Tags` 和 `Categories` 目前作为逗号分隔的字符串存储 (`gorm:"type:text"`).
**优化建议**:
-   **规范化**: 建立 `Tag` 和 `Category` 独立表，并使用多对多关联表 (`blog_post_tags`, `blog_post_categories`)。
-   **优势**: 
    -   大幅提升按标签/分类筛选的性能（可使用索引）。
    -   更容易维护标签的一致性（重命名标签只需改一处）。
    -   方便统计标签使用次数。

### 2.2 权限控制逻辑分散
**位置**: 散落在各个 Resolver 中 (e.g., `if currentUser.Role != "ADMIN" ...`).
**优化建议**:
-   引入统一的 **Policy/Casbin** 层或专门的 Permission Service，将 "谁能看什么文章" 的逻辑集中管理。当前逻辑硬编码在 Resolver 中，容易在新增接口时遗漏。

## 3. 前端优化 (Frontend)

### 3.1 客户端配置
**位置**: `src/graphql/client.ts`
**现状**: 
配置了 `VITE_API_BASE_URL`，这很好。
**建议**:
-   增加 Token 过期自动刷新的逻辑（Refresh Token Flow）。目前前端似乎只在 `authLink` 中读取 Token，如果 Token 过期请求会直接失败，需要拦截 401 错误并尝试使用 `refreshToken` 接口换取新 Token。

### 3.2 组件设计
**位置**: `src/components/Root.tsx`
**现状**:
直接操作了 `localStorage`。
**建议**:
-   将 Auth 状态管理封装到 Context 自定义 Hook (`useAuth`) 中，避免在多个地方直接读取 `localStorage`。

## 4. 修复与改进计划

我建议按以下优先级进行修复：

1.  **修复 `Posts` 解析器**: 立即添加 `.Preload("Author")`，防止线上崩溃或数据为空。
2.  **重构标签系统**: 迁移到关联表结构，为以后的性能打好基础。
3.  **优化搜索**: 引入简单的全文检索（如 SQLite FTS5 或 PostgreSQL TSVector），或者至少为常用字段添加索引。
4.  **前端 Auth 增强**: 实现无感刷新 Token。

---
**下一步**: 如果您同意，我可以先为您修复最紧急的 `Posts` 解析器问题。
