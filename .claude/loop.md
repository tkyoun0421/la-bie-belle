# Claude loop contract

Continue only the next `planned` task from `docs/execution/phases/index.jsonl`. Preserve product/development approvals, one `in_progress`, RADIO SHA-256, and handoff checkpoints. On normal completion record the checkpoint and stop; on auth, billing, critical validation, or a new decision, stop with `needs_user`. Never change sleep/reboot/login settings, credentials, payment, or permissions.

When launched with a scheduled resume, resume the existing session at the specified time. Before the supplied `--not-before` time, continue execution only; do not create or approve planning/design work. Planning and design are allowed after that time only when the repository approval gates permit them.
