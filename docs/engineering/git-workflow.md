# Git Workflow

Commits use Conventional Commits.

Allowed types:

- `feat`
- `fix`
- `docs`
- `test`
- `refactor`
- `chore`
- `ci`

Commit messages must include a body with at least two non-empty lines.

Husky runs two local gates:

- `pre-commit`: runs `lint-staged` for staged formatting and ESLint fixes
- `commit-msg`: runs commitlint

Full `typecheck`, `test`, and `build` checks run manually or in CI, not in `pre-commit`.

AI harness artifact changes usually use `docs` or `chore(harness)`.
