# Project Structure

Application source lives under `src`.

- `src/app`: Next.js routes, layouts, metadata, and provider wiring
- `src/screen`: page-level UI composition
- `src/features`: user actions and workflow features
- `src/entities`: domain models, types, state, and display rules
- `src/shared`: shared UI, config, libraries, and utilities
- `tests`: global smoke tests
- `supabase`: Supabase CLI local stack configuration, migrations, and seeds

The intended dependency direction is:

```txt
app -> screen -> features -> entities -> shared
```

Lower layers do not import from higher layers.
