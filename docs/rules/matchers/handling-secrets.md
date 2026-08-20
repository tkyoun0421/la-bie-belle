---
owner: "@orchestrator"
related_adr: ""
related_issue: "#69"
---

# Matcher: Handling secrets

Load this when touching credentials or `.env*` files.

**This repository is public.**

Secrets live in `.env` and `.env.local` only. `.env.example` carries placeholders — key names and shapes, never a working value.

`.githooks/pre-commit` blocks any `.env*` or `.envrc` anywhere in the tree, with `.env.example` as the sole exception.

At review, a secret in the diff is a `critical` finding and the merge stops.
