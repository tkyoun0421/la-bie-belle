# Local Database

The local database uses the Supabase CLI local stack.

Docker Desktop or Docker Engine must be running before starting the stack.

Commands:

```bash
pnpm db:start
pnpm db:status
pnpm db:stop
pnpm db:reset
```

These scripts wrap Supabase CLI commands and use `supabase/config.toml`.

The local stack is separate from any remote or production Supabase project. Do not commit production Supabase URLs, service role keys, or user data.

CI does not start the local Supabase stack for issue #24.
