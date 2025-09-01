# Playground Project

A full-stack playground project with React frontend and Go backend.

## Tech Stack

- **Frontend** located in `src` directory, packaged with [Vite](https://vitejs.dev/), integrated with [Tailwind CSS](https://tailwindcss.com/) and [Ant Design](https://ant.design/) component library.
- **Backend** located in `backend` directory, built with Go and [Gin](https://gin-gonic.com/) framework.
- **Database** uses SQLite for development and PostgreSQL for production.
- **API** follows RESTful principles with GraphQL support.
- **Authentication** implemented with JWT tokens.
- **Deployment** uses Docker for containerization.

## Project Structure

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
