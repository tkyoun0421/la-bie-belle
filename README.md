# La Bie Belle

Wedding hall staff scheduling workspace.

## Prerequisites

- Node.js 22
- pnpm 10
- Docker Desktop, required by the Supabase CLI local stack

## Install

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

The app runs with Next.js. The initial screen is only a development baseline; product features are intentionally outside issue #24.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

CI runs the same verification flow on push to `main` and on pull requests.

## Local Database

The local database uses the Supabase CLI local stack. Docker is required, and the local stack is separate from any remote or production Supabase project.

```bash
pnpm db:start
pnpm db:status
pnpm db:stop
pnpm db:reset
```

The default local Postgres port is `54322`. If that port is already in use, update `supabase/config.toml`.

## Styling

Tailwind is configured for the initial app shell. The design system is intentionally deferred to the next issue after #24.

## Environment

Copy `.env.example` to `.env.local` for local app development and fill values as needed. Do not commit production Supabase credentials or service role keys.

## Commit Flow

Husky runs `lint-staged` before commits. The pre-commit gate formats staged files and runs ESLint fixes on staged JavaScript and TypeScript files. Commit messages follow Conventional Commits and require at least two non-empty body lines. Full validation remains the responsibility of CI and the verification commands above.

## Project Standards

- [Project structure](docs/architecture/project-structure.md)
- [Naming conventions](docs/engineering/naming-conventions.md)
- [Git workflow](docs/engineering/git-workflow.md)
- [Local database](docs/infrastructure/local-database.md)
- [Issue priority](docs/operations/issue-priority.md)
