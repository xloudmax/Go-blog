# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React/TypeScript/Vite)
- `pnpm dev` - Start development server (http://localhost:5173)
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm test` - Run tests with Vitest
- `pnpm test:run` - Run tests once without watch mode
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Run ESLint with auto-fix
- `pnpm type-check` - Run TypeScript type checking
- `pnpm codegen` - Generate GraphQL types from schema
- `pnpm codegen:watch` - Generate GraphQL types in watch mode

### Backend (Go)
- `cd backend && go run main.go` - Start development server (port 11451)
- `cd backend && go mod tidy` - Clean up dependencies
- `cd backend && go test ./...` - Run all tests
- `cd backend && go build -o bin/server` - Build production binary
- `cd backend && go generate ./...` - Generate GraphQL resolvers and types

## Architecture Overview

### Backend (Go)
- **Framework**: Gin HTTP framework with GraphQL via gqlgen
- **Database**: GORM with SQLite (dev) / PostgreSQL (prod)
- **Architecture**: Clean architecture with separate layers:
  - `main.go` - Application entry point with server setup
  - `routes/` - HTTP routing, primarily GraphQL endpoint at `/graphql`
  - `graph/` - GraphQL schema, resolvers, and generated code
  - `services/` - Business logic (blog, auth, search, comments)
  - `models/` - Database models and JWT utilities
  - `middleware/` - JWT auth, logging, CORS, rate limiting
  - `database/` - Database connection and migrations
  - `config/` - Configuration management

### Frontend (React/TypeScript)
- **Framework**: React 19 with TypeScript, built with Vite
- **UI Library**: Ant Design v5 with custom theming
- **State Management**: Apollo Client for GraphQL + custom hooks
- **Styling**: Tailwind CSS v4 with PostCSS
- **Architecture**:
  - `src/main.tsx` - Application entry point
  - `src/components/Root.tsx` - Root component with providers
  - `src/pages/` - Route components organized by feature
  - `src/hooks/` - Custom hooks for business logic
  - `src/api/graphql/` - GraphQL operations
  - `src/generated/` - Auto-generated GraphQL types
  - `src/components/` - Reusable UI components

### GraphQL Integration
- **Schema**: Single schema at `backend/graph/schema.graphql`
- **Code Generation**: 
  - Backend: gqlgen generates Go resolvers and types
  - Frontend: graphql-codegen generates TypeScript types and hooks
- **API**: Single GraphQL endpoint at `/graphql` handles all operations
- **Authentication**: Optional JWT middleware, context-aware resolvers

### Key Features
- **Blog System**: Posts with versioning, categories, tags, and comments
- **User Management**: Registration, JWT auth, email verification, admin roles
- **File Management**: Markdown file upload/editing with folder organization  
- **Search**: Enhanced search with suggestions, facets, and caching
- **Admin Panel**: User management, invite codes, system monitoring

## Development Workflow

1. **Backend Changes**: Modify schema → run `go generate ./...` to update resolvers
2. **Frontend Changes**: After schema changes, run `pnpm codegen` to update types
3. **Database**: Migrations handled automatically in `database/migrations.go`
4. **Testing**: 
   - Backend: Standard Go testing in `tests/`
   - Frontend: Vitest with jsdom environment, setup in `src/test/setup.ts`

## Important Notes

- **React 19 Compatibility**: Uses `@ant-design/v5-patch-for-react-19` 
- **Package Manager**: Uses pnpm with lockfile committed
- **Module Name**: Backend module is `repair-platform` (legacy name)
- **Port Configuration**: Frontend dev server (5173), Backend server (11451)
- **GraphQL Playground**: Available in development at `/graphql` (GET request)
- **Authentication**: JWT tokens with optional authentication on GraphQL operations

## GraphQL Communication Issues Fixed

**Important**: The following GraphQL issues have been identified and resolved:

### 1. Fragment Consistency
- **Problem**: Frontend GraphQL operations were not using fragments, leading to inconsistent field selections
- **Solution**: Updated `src/api/graphql/blog.ts` to use proper fragments for consistent data fetching
- **Impact**: Ensures all queries return the same data structure and reduces query size

### 2. Resolver Implementation Status
- **Problem**: Many GraphQL resolvers in `backend/graph/schema.resolvers.go` were not implemented (panic statements)
- **Solution**: Implemented critical resolvers including:
  - `RefreshToken` - JWT token refresh functionality
  - `SendVerificationCode` - Email verification code sending
  - `VerifyEmail` - Email verification process
  - `ArchivePost` - Post archiving functionality
- **Status**: Some advanced features still use placeholder implementations for development

### 3. Type Safety Improvements
- **Problem**: Inconsistent type usage between frontend and backend
- **Solution**: Fixed compilation errors and ensured proper type generation
- **Commands**: Always run `pnpm codegen` after schema changes and `go generate ./...` for backend

### 4. Authentication Flow
- **Problem**: JWT generation method mismatch in resolvers
- **Solution**: Use `models.GenerateJWT()` instead of non-existent service methods
- **Pattern**: All JWT operations should use the models package utilities

### Best Practices for GraphQL
1. Always use fragments for consistent data fetching
2. Run `pnpm codegen` after any schema changes
3. Test both frontend build and backend compilation after changes
4. Use proper error handling in resolvers (don't leave panic statements)
5. Maintain type consistency between generated types and custom types

## Important Notes

- **React 19 Compatibility**: Uses `@ant-design/v5-patch-for-react-19`
- **Package Manager**: Uses pnpm with lockfile committed
- **Module Name**: Backend module is `repair-platform` (legacy name)
- **Port Configuration**: Frontend dev server (5173), Backend server (11451)
- **GraphQL Playground**: Available in development at `/graphql` (GET request)
- **Authentication**: JWT tokens with optional authentication on GraphQL operations
- **GraphQL Generation**: Backend uses gqlgen.yml for code generation configuration
- **Database**: SQLite for development (blog_platform.db), automatic migrations
- ## 现代化全栈博客平台 (Notion-like) *2024.06 - 至今*
**全栈开发** - 基于 Clean Architecture 构建的高性能内容管理系统，支持 Markdown 实时渲染
- **高性能后端**：使用 **Go + Gin + GraphQL** 构建 API，相比 RESTful 减少 **60%+** 的网络往返；采用分层架构 (Controller/Service/Repo) 确保业务解耦。
- **类型安全前端**：基于 **React 19 + TypeScript**，利用**graphql-codegen**自动生成前后端一致的类型定义，消除接口联调的数据类型错误。
- **安全与优化**：设计 **JWT + Refresh Token** 双重认证体系；使用 GORM 连接池优化数据库并发性能。

补充