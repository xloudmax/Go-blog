# Technology Stack

## Frontend
- **Framework**: React 19.1.1 with TypeScript
- **Build Tool**: Vite 7.1.3
- **Styling**: Tailwind CSS 4.1.12 + Ant Design 5.27.1
- **State Management**: Apollo Client 3.14.0 for GraphQL
- **Routing**: React Router DOM 7.8.2
- **Package Manager**: pnpm 10.11.0
- **Testing**: Vitest 3.2.4 + Testing Library

## Backend
- **Language**: Go 1.24
- **Framework**: Gin web framework
- **Database**: SQLite (development) / PostgreSQL (production) with GORM
- **API**: GraphQL with gqlgen + REST endpoints
- **Authentication**: JWT tokens with refresh token support
- **Logging**: Zap structured logging with Lumberjack rotation
- **File Storage**: Local filesystem with configurable upload paths

## Development Tools
- **Code Generation**: GraphQL Code Generator for TypeScript types
- **Linting**: ESLint with TypeScript support
- **Containerization**: Docker with docker-compose
- **Hot Reload**: Vite dev server + Go air (if configured)

## Common Commands

### Frontend Development
```bash
# Install dependencies
pnpm install

# Start development server (localhost:5173)
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
pnpm test:run

# Generate GraphQL types
pnpm codegen
pnpm codegen:watch

# Linting
pnpm lint
pnpm lint:fix

# Type checking
pnpm type-check
```

### Backend Development
```bash
# Navigate to backend
cd backend

# Run in development mode (port 11451)
go run main.go

# Build binary
go build -o app main.go

# Run tests
go test ./...

# Generate GraphQL resolvers
go generate ./...

# Database migrations (handled automatically on startup)
```

### Docker Development
```bash
# Start full stack
docker-compose up

# Build and start
docker-compose up --build

# Stop services
docker-compose down
```

## Environment Configuration
- Frontend: Environment variables prefixed with `VITE_`
- Backend: Uses `.env` file with comprehensive configuration system
- See `backend/CONFIG.md` for detailed configuration options
