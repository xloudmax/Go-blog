# Project Structure

## Root Level Organization
```
playground/
├── backend/           # Go backend application
├── src/              # React frontend source
├── public/           # Static assets
├── dist/             # Build output
├── node_modules/     # Frontend dependencies
└── .kiro/            # Kiro AI assistant configuration
```

## Frontend Structure (`src/`)
```
src/
├── api/              # API layer and GraphQL operations
│   └── graphql/      # GraphQL queries, mutations, subscriptions
├── components/       # Reusable UI components
├── pages/            # Route-level page components
│   └── admin/        # Admin-specific pages
├── hooks/            # Custom React hooks
├── types/            # TypeScript type definitions
├── styles/           # CSS and styling files
├── generated/        # Auto-generated GraphQL types
├── graphql/          # GraphQL schema and client config
├── theme/            # Ant Design theme configuration
├── utils/            # Utility functions
├── services/         # Business logic services
└── __tests__/        # Test files
```

## Backend Structure (`backend/`)
```
backend/
├── main.go           # Application entry point
├── config/           # Configuration management
├── database/         # Database connection and migrations
├── graph/            # GraphQL schema and resolvers
├── models/           # Data models and GORM entities
├── services/         # Business logic layer
├── middleware/       # HTTP middleware (auth, logging, CORS)
├── routes/           # HTTP route definitions
├── utils/            # Utility functions and helpers
├── uploads/          # File upload storage
├── logs/             # Application logs
└── tests/            # Test files
```

## Key Conventions

### File Naming
- **Frontend**: PascalCase for components (`ArticleCard.tsx`), camelCase for hooks (`useBlog.ts`)
- **Backend**: snake_case for files (`blog_service.go`), PascalCase for types
- **Tests**: `*.test.tsx` for frontend, `*_test.go` for backend

### Import Patterns
- **Frontend**: Use `@/` alias for src imports, absolute imports preferred
- **Backend**: Use module name `repair-platform/` for internal imports

### Component Organization
- One component per file with default export
- Co-locate styles with components when component-specific
- Separate business logic into custom hooks
- Use TypeScript interfaces for props

### API Layer
- GraphQL operations in `src/api/graphql/`
- Generated types in `src/generated/graphql.ts`
- Custom hooks for data fetching in `src/hooks/`

### State Management
- Apollo Client for GraphQL state
- Local component state with useState/useReducer
- Custom hooks for complex state logic

### Styling Approach
- Tailwind CSS for utility-first styling
- Ant Design components for complex UI elements
- CSS modules for component-specific styles
- Design system tokens in `src/styles/design-system.css`

### Testing Strategy
- Unit tests co-located with components
- Integration tests in `__tests__/` directories
- Test utilities in `src/test/setup.ts`
- Mock GraphQL operations for testing
