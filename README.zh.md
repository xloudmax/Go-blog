# Playground 项目

一个包含 React 前端和 Go 后端的全栈练习项目。

## 技术栈

- **前端** 位于 `src` 目录，使用 [Vite](https://vitejs.dev/) 进行打包，集成了 [Tailwind CSS](https://tailwindcss.com/) 和 [Ant Design](https://ant.design/) 组件库。
- **后端** 位于 `backend` 目录，使用 Go 语言和 [Gin](https://gin-gonic.com/) 框架构建。
- **数据库** 开发环境使用 SQLite，生产环境使用 PostgreSQL。
- **API** 遵循 RESTful 原则，支持 GraphQL。
- **身份验证** 使用 JWT 令牌实现。
- **部署** 使用 Docker 进行容器化。

## 项目结构

```text
playground/
├─ backend/            # Go 服务端代码
│  ├─ controllers/     # 业务控制器
│  ├─ database/        # 数据库初始化
│  ├─ graph/           # GraphQL schema 与 resolver
│  ├─ middleware/      # 日志、鉴权等中间件
│  └─ main.go          # 服务入口
├─ src/                # React 前端代码
│  ├─ pages/           # 页面组件
│  ├─ components/      # 公共组件
│  └─ api/             # 与后端交互的封装
├─ package.json        # 前端依赖与脚本
└─ README.md           # 英文说明
```

## 前端开发

1. 安装依赖（需要 [pnpm](https://pnpm.io/)）：
   ```bash
   pnpm install
   ```
2. 启动开发服务器：
   ```bash
   pnpm dev
   ```
   默认会在 <http://localhost:5173> 运行。
3. 构建生产包：
   ```bash
   pnpm build
   ```

## 后端运行

确保本机已安装 Go 1.24 及以上版本。

```bash
cd backend
# 在开发模式下启动
go run main.go
```

服务会监听 `11451` 端口，接口前缀为 `/api`。如需在生产环境运行，可设置环境变量 `GIN_MODE=release` 并自行配置日志及邮箱参数。

## 常见功能

- 用户注册、登录以及邮箱验证（`controllers/auth.go`）。
- 文章与文件管理接口，支持上传 Markdown 与图片（`controllers/folders.go`、`controllers/image.go` 等）。
- GraphQL 查询与变更定义在 `graph/schema.graphql` 中，可按需扩展。
- 前端提供 Markdown 编辑器和基本的路由页面示例（位于 `src/pages`）。

## 贡献

欢迎提交 Issue 或 Pull Request 进行改进。开发过程中可根据需要调整前后端端口或数据库配置。

