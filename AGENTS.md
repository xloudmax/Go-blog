# Repository Guidelines

## Project Structure & Module Organization
Frontend code sits in `src/` (pages in `src/pages`, shared UI in `src/components`, API clients in `src/api`), while static assets and html entrypoints stay in `public/` and `index.html`. The Go backend lives in `backend/`: controllers handle HTTP traffic, `database/` wires SQLite/Postgres, `graph/` stores the GraphQL schema and generated resolvers, and utility packages sit under `services/` and `utils/`. Keep environment templates or secrets in `backend/config/` and never inside source folders.

## Build, Test, and Development Commands
Run `pnpm install` once, then `pnpm dev` for the Vite dev server (port 5173) and `pnpm build` for production assets. `pnpm preview` validates the bundle, `pnpm lint` / `pnpm lint:fix` enforce lint rules, and `pnpm type-check` runs `tsc --noEmit`. Sync GraphQL types with `pnpm codegen` or `pnpm codegen:watch`. Backend work is usually `cd backend && go run main.go`; add `GIN_MODE=release` to mirror prod. Use `docker-compose up --build` to exercise the whole stack locally.

## Coding Style & Naming Conventions
TypeScript follows the repository ESLint config (ES2020 modules, no `any`, warn on unused values) and Tailwind utility-first styling. Prefer functional React components, PascalCase filenames for components (`ArticleList.tsx`), camelCase hooks/utility exports, and descriptive GraphQL operation names colocated with the component that consumes them. Go uses standard `gofmt`, lower_snake package directories, and exported identifiers only when cross-package use is required.

## Testing Guidelines
Vitest with Testing Library is the default for UI logic; place specs alongside code with the `*.test.tsx` or `*.spec.ts` suffix. Use `pnpm test` for watch mode and `pnpm test:run` for deterministic CI runs. Backend logic should keep `_test.go` files close to the package or under `backend/tests`, executed via `go test ./...`. Assert HTTP handlers with the fixtures in `backend/testing`.

## Commit & Pull Request Guidelines
History shows Conventional Commit prefixes (`feat:`, `fix:`, `chore:`); follow that style and keep subject lines short and actionable. Each PR should describe the change, list commands/tests executed (`pnpm test`, `go test ./...`, etc.), link issues, and attach screenshots or curl logs for user-facing updates. Request review only after linting and type checks succeed locally.

## Security & Configuration Tips
Never commit `.env` files, SQLite snapshots, or generated secrets. Use `backend/config/*.yaml`, `set_env.sh`, or deployment infrastructure to supply credentials, JWT keys, and SMTP tokens before starting services.
