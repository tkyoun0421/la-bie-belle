---
name: slices
description: "Breaks an [Epic] into vertical slice [Slice] sub-issues on GitHub. Produces no document. Normally reached through the /doc router. Dev only."
---

# Slices

Takes an Epic number, reads the spec it links to, and publishes one `[Slice]` Issue per vertical slice. No file is written and no PR is opened.

## Read the source

```
gh issue view <epic> --comments
```

Follow the link to `docs/specs/<feature>.md` and read the file. The Issue body is a summary — the acceptance criteria live in the file, and those are what the slices divide.

Unless the router already handed you citations, run `docs-locator` for decisions that constrain the implementation before deciding the shape.

## Cut the slices

A slice cuts a narrow but complete path through every layer — schema, API, screen, tests. It is demoable on its own and sized to fit one fresh context window. A layer cut horizontally is not a slice: "add the database tables" leaves nothing a person can look at.

Each slice claims a subset of the spec's numbered acceptance criteria. Every criterion lands in exactly one slice. A criterion nobody claimed means the Epic is not fully sliced; a criterion claimed twice means two slices will fight over the same code.

Name the slices that must finish first. A slice with no predecessor can start immediately.

For each slice, also outline how it is built — what the screen, the server, and the data each need — and what to watch for when two users collide or a call fails. The `[Slice]` form asks for both, and Dev is the only one who can answer them. Keep it to the outline: exact endpoint signatures, column types, and response shapes belong in the design document, not in the Issue.

A wide mechanical refactor is the exception to vertical slicing — one change whose blast radius crosses the whole codebase cannot land green as a tracer bullet. Sequence it instead: add the new form beside the old, migrate call sites in batches small enough to keep CI green, then delete the old form once no caller remains. Each step is its own slice, blocked by the previous one.

## Publish

Dispatch `gh-issue-generator` with the slice list, in dependency order so each Issue can reference real numbers. It creates them in Korean, attaches each as a sub-issue of the Epic, applies the labels, and puts the cards on the board.

New slice cards go to **Backlog**, except the ones with no predecessor, which go to **Todo** — those are what Dev can pick up immediately.

Do not modify or close the Epic, and do not move its card. PM closes it when every slice is closed.

This skill writes no file and opens no PR, so there is no branch to cut and no card of its own to move. Slicing is finished when the Issues exist and are on the board.
