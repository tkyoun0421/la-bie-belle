---
name: interview
description: "Interviews the user until every decision behind a plan is settled — one round at a time, each question carrying its background, its options as competing claims, and what each option wins and loses. Use before writing a PRD, spec, domain document, ADR, or TDR, before amending the rules set, and whenever a plan needs stress-testing. Korean triggers: 인터뷰 해줘, 질문해줘, 뭘 정해야 하지, 이 계획 따져줘, 설계 검증, 결정 좀 하자."
---

# Interview

Settle every decision behind a plan before anyone writes a document or touches code. You ask; the user decides.

Model the plan as a tree. Each answer settles one decision and opens the ones hanging off it.

## Rounds

The frontier is every decision whose prerequisites are already settled — the questions answerable now, without guessing at an answer you have not heard.

Ask the whole frontier in one round, numbered. Then stop and wait. A question that depends on another question still open belongs to the next round, not this one.

Recompute the frontier from the answers. Repeat until it is empty.

## Facts are yours, decisions are the user's

Never ask the user for something the repository can answer. Dispatch `docs-locator` for anything under `docs/`; read the file yourself for anything else. Every claim in a question carries its `file:line`.

A running search is an unsettled prerequisite. Ask the rest of the frontier now and hold only the questions downstream of it.

## Question format

Four blocks, in this order.

**What the problem is.** Prose, never a list. Three beats: how it stands today, what that costs in one concrete situation, and why the question opens now. Citations sit inside the sentences.

**Options.** Each option is a claim, not a menu item. Under its heading, two lines: why the claim holds, and what actually changes — which file, which situation. Three real options beat five padded ones.

**What each option wins and loses.** A table, one row per option, a column for each. Short cells: this block is for comparison side by side, not for argument.

**Recommendation.** One option, one line of why.

Rendered — headings in the user's language, structure as below:

```
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

Hand the settled set to whatever comes next: the stage skill that writes the document, or the session's own work.

## Not this

Write no file. The decisions land in the document the caller writes, or in an ADR or TDR.

Ask no question the repository already answers.
