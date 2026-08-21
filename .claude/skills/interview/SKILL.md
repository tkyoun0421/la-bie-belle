---
name: interview
description: "Interviews the user until every decision behind a plan is settled — one question at a time, each carrying its background, its options as competing claims, and what each option wins and loses. Use before writing a PRD, spec, domain document, ADR, or TDR, before amending the rules set, and whenever a plan needs stress-testing. Korean triggers: 인터뷰 해줘, 질문해줘, 뭘 정해야 하지, 이 계획 따져줘, 설계 검증, 결정 좀 하자."
---

# Interview

Settle every decision behind a plan before anyone writes a document or touches code. You ask; the user decides.

Model the plan as a tree. Each answer settles one decision and opens the ones hanging off it.

## One question at a time

The frontier is every decision whose prerequisites are already settled — the questions answerable now, without guessing at an answer you have not heard.

Ask one of them. One question, not the frontier. Then stop and wait. Several questions in one turn arrive as a wall of text and come back half answered.

Number the questions in the order you ask them, across the whole interview — Q1, then Q2, then Q3. The count never restarts at a new turn.

Open the turn with the frontier as titles — one line each, no bodies — so the size and the order of what is left is visible without being asked to answer it. Then ask the first. Keep that list current as answers land.

Order the frontier by what it unblocks. A decision that changes the shape of later questions goes first.

After each answer, recompute the frontier and ask the next question. A question that depends on one still open is not on the frontier at all. Repeat until it is empty.

## Facts are yours, decisions are the user's

Never ask the user for something the repository can answer. Unless the caller already handed you citations, dispatch `docs-locator` for anything under `docs/`; read the file yourself for anything else. Every claim in a question carries its `file:line`.

A question whose facts you do not yet hold is not ready to ask, but the decision stays on the frontier — finding those facts is your work, not a reason to drop it. `docs-locator` answers in one shot: run it, read what it returns, then ask.

## Question format

Four blocks, in this order.

**What the problem is.** Prose, never a list. Three beats: how it stands today, what that costs in one concrete situation, and why the question opens now. Citations sit inside the sentences.

**Options.** Each option is a claim, not a menu item. Under its heading, two lines: why the claim holds, and what actually changes — which file, which situation. Three real options beat five padded ones.

**What each option wins and loses.** A table, one row per option, a column for each. Short cells: this block is for comparison side by side, not for argument.

**Recommendation.** One option, one line of why.

Rendered — headings in the user's language, structure as below:

```
<what is left: one line per decision still on the frontier, titles only, this one marked>

❓ **Q1 — <the decision, in one line>**

### <what the problem is>
<prose, three beats, citations inline>

### <options>
**A. <the claim>**
<why it holds>
<what changes>

**B. <the claim>**
…

### <what each wins and loses>
| | <wins> | <loses> |
|---|---|---|
| A | … | … |
| B | … | … |

### <recommendation>
**B** — <one line>
```

## Language

Ask in the language the user is writing in. Where that is Korean, choose the everyday word over the Sino-Korean compound, and keep every sentence short enough to read once.

## Ending

When the frontier is empty, list every settled decision, then ask for approval in as many words. An answer given during the interview is not approval — the summary is what gets approved, and nothing is acted on until it does.

Hand the settled set back to whoever called you. A stage skill calls this skill from inside its own Gather, which means `/doc` has already resolved ownership and cut the branch — return to that skill and let it write. Never send it back through the router.

Nobody calls you when the user reaches this skill directly. If a document follows from there, start it through `/doc`: the router is what resolves ownership and cuts the branch, and the settled decisions travel with you in the conversation. Walking into a stage skill from here skips both.

When the session's own work follows instead, carry on with it.

## Not this

Write no file. The decisions land in the document that follows — the one the calling stage skill writes, or the one `/doc` routes to.

Ask no question the repository already answers.
