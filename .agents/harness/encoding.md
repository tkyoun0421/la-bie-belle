# Harness Encoding Guide

The harness stores markdown, JSON, and JavaScript files as UTF-8.

## PowerShell Display

If Korean text appears garbled in PowerShell output, set the session output encoding before reading files:

```powershell
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding
chcp 65001
```

This affects display in the current shell session. It does not rewrite files.

## Authoring Rules

- Save harness markdown, JSON, and JavaScript files as UTF-8.
- Prefer ASCII for harness scripts and machine-readable files unless Korean text is part of user-facing documentation.
- Keep generated JSON values UTF-8 and avoid lossy console copy/paste when migrating Korean content.
- When a file is only an operational contract for agents, English ASCII is acceptable and reduces shell display risk.

## Verification

Use these read-only checks when encoding problems are suspected:

```powershell
Get-Content .agents/harness/README.md -Raw
git diff -- .agents/harness/README.md
```

If `git diff` displays text correctly but `Get-Content` does not, the file is likely fine and the shell output encoding is the problem.

## Migration Rule

When cleaning up existing garbled operational docs, prefer rewriting the whole small document in UTF-8 instead of patching corrupted fragments. Do not rewrite product-facing Korean content unless the source text is known.
