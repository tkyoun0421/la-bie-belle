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

Run `docs-locator` for decisions that constrain the implementation before deciding the shape.

## Cut the slices

A slice cuts a narrow but complete path through every layer — schema, API, screen, tests. It is demoable on its own and sized to fit one fresh context window. A layer cut horizontally is not a slice: "add the database tables" leaves nothing a person can look at.

Each slice claims a subset of the spec's numbered acceptance criteria. Every criterion lands in exactly one slice. A criterion nobody claimed means the Epic is not fully sliced; a criterion claimed twice means two slices will fight over the same code.

Name the slices that must finish first. A slice with no predecessor can start immediately.

A wide mechanical refactor is the exception to vertical slicing — one change whose blast radius crosses the whole codebase cannot land green as a tracer bullet. Sequence it instead: add the new form beside the old, migrate call sites in batches small enough to keep CI green, then delete the old form once no caller remains. Each step is its own slice, blocked by the previous one.

## Publish

Dispatch `gh-issue-generator` with the slice list, in dependency order so each Issue can reference real numbers. It creates them in Korean, attaches each as a sub-issue of the Epic, applies the labels, and puts the cards on the board.

Do not modify or close the Epic. PM closes it when every slice is closed.
