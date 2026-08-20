---
owner: "@orchestrator"
related_adr: ""
related_issue: "#69"
---

# Matcher: Blocked

Load this when you cannot proceed.

**Never stop quietly.** A session that goes silent looks identical to one that is still working.

Move the board card to **Blocked** and leave a reason comment on the Issue. The comment is mandatory — a card in Blocked without one tells nobody anything.

A card sits in Blocked because of a spec gap, a pending `[Request]`, or an unmet dependency. The orchestrator sweeps the Blocked column regularly.
