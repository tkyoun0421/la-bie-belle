window.AI_HARNESS_RUNS = {
  "generated_at": "2026-05-11T05:22:26.000Z",
  "summary": {
    "issue_count": 0,
    "average_issue_score": 0,
    "pass_count": 0,
    "rework_count": 0,
    "fail_count": 0,
    "average_harness_score": null
  },
  "runs": [],
  "harness_health": {
    "total_score": null,
    "missing": true,
    "categories": [],
    "proposals": [
      {
        "proposal_id": "2026-05-10-dashboard-health-missing-state",
        "target_area": "record_dashboard",
        "title": "2026-05-10-dashboard-health-missing-state",
        "reason": "When harness-health-score.json is missing, dashboard data can show average_harness_score or harness_health.total_score as 0. That makes a missing evaluation hard to distinguish from a real zero score.",
        "expected_impact": "Users can detect missing harness-health evaluation early and avoid mistaking missing data for a valid score.",
        "status": "proposed",
        "file": ".agents/harness/improvements/proposals/2026-05-10-dashboard-health-missing-state.json"
      },
      {
        "proposal_id": "2026-05-10-verification-ci-parity",
        "target_area": "verification_gate",
        "title": "2026-05-10-verification-ci-parity",
        "reason": "Issue #24 passed local verification, but PR-time CI still exposed configuration problems such as commitlint revision range handling and formatting differences. The verification step did not clearly separate local command results from PR CI readiness.",
        "expected_impact": "PRs are more likely to be ready to merge immediately after review because CI-only failures are considered before PR creation.",
        "status": "proposed",
        "file": ".agents/harness/improvements/proposals/2026-05-10-verification-ci-parity.json"
      }
    ]
  },
  "agents": [
    {
      "name": "Planner",
      "file": ".agents/harness/agents/planner.agent.md",
      "purpose": "Convert a GitHub Issue into task-spec.md and plan.md.",
      "outputs": [
        "task-spec.md",
        "plan.md"
      ],
      "handoff": "Pass a concrete task spec and plan to implementation."
    },
    {
      "name": "Spec",
      "file": ".agents/skills/ai-harness-spec/SKILL.md",
      "purpose": "Clarify decisions and write spec.md before implementation.",
      "outputs": [
        "spec.md"
      ],
      "handoff": "Pass detailed scenarios and Red priorities to Red."
    },
    {
      "name": "Implementer",
      "file": ".agents/harness/agents/implementer.agent.md",
      "purpose": "Implement code or configuration changes.",
      "outputs": [
        "implementation-notes.md"
      ],
      "handoff": "Pass changed files and notes to verification."
    },
    {
      "name": "Verifier",
      "file": ".agents/harness/agents/verifier.agent.md",
      "purpose": "Run verification commands and record evidence.",
      "outputs": [
        "verification.md"
      ],
      "handoff": "Pass verification evidence and diff context to review."
    },
    {
      "name": "Reviewer",
      "file": ".agents/harness/agents/reviewer.agent.md",
      "purpose": "Score the run and decide PASS, REWORK, or FAIL.",
      "outputs": [
        "review-score.json",
        "review.md"
      ],
      "handoff": "PASS goes to PR, REWORK returns to implementation, FAIL waits for human review."
    },
    {
      "name": "Harness Evaluator",
      "file": ".agents/harness/agents/harness-evaluator.agent.md",
      "purpose": "Evaluate harness health and propose improvements.",
      "outputs": [
        "harness-health-score.json",
        "harness-improvements.md"
      ],
      "handoff": "Approved improvements are implemented separately."
    }
  ],
  "workflow": [
    {
      "step": "1",
      "name": "Planner",
      "status": "Create task-spec.md and plan.md"
    },
    {
      "step": "2",
      "name": "Spec",
      "status": "Create spec.md and Red priorities"
    },
    {
      "step": "3",
      "name": "Red",
      "status": "Write or record failing tests"
    },
    {
      "step": "4",
      "name": "Green",
      "status": "Implement the minimum passing change"
    },
    {
      "step": "5",
      "name": "Verify",
      "status": "Run verification and write verification.md"
    },
    {
      "step": "6",
      "name": "Review",
      "status": "Score and decide PASS, REWORK, or FAIL"
    },
    {
      "step": "7",
      "name": "Dashboard",
      "status": "Project run state into dashboard data"
    },
    {
      "step": "8",
      "name": "PR",
      "status": "Draft a PR only for PASS runs"
    }
  ]
};
