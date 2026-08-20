---
owner: "@orchestrator"
related_adr: ""
related_issue: "#69"
---

# Matcher: Handling secrets

Load this when touching credentials, `.env*` files, or anything a public repository must not hold.

**This repository is public.** Anything committed is world-readable the moment it is pushed, and a later deletion does not undo it — the value stays in the history and in every clone and cache that already fetched it.

## Where values live

- Real values go in `.env` and `.env.local` only. Both are ignored by git and stay on the machine.
- `.env.example` is the only committed environment file, and it holds placeholders — key names and shapes, never a working value.
- Never paste a key, token, connection string, or password into a document, an Issue, a PR body, or a comment. Refer to it by key name.

## Guards

`.githooks/pre-commit` blocks any `.env*` or `.envrc` anywhere in the tree, with `.env.example` as the sole exception, and `.gitignore` keeps them out of `git add` in the first place.

Never use `git add -f` on an ignored file, and never use `git commit --no-verify` to get around the block. Both are rule violations, not workarounds.

## If a secret was committed

Treat the value as compromised the moment the commit exists locally, and as public the moment it is pushed.

1. Say so immediately — in the PR, and to the orchestrator. Do not quietly amend and move on.
2. Rotate the credential at its source. That is the only step that actually fixes it.
3. Then clean the history.

At review, a secret in the diff is a `critical` finding and the merge stops.
