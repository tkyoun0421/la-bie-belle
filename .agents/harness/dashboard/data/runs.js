window.AI_HARNESS_RUNS = {
  "generated_at": "2026-05-11T05:15:29.927Z",
  "summary": {
    "issue_count": 1,
    "average_issue_score": 89,
    "pass_count": 1,
    "rework_count": 0,
    "fail_count": 0,
    "average_harness_score": 74
  },
  "runs": [
    {
      "issue_number": 24,
      "title": "프로젝트 개발 표준 뼈대 생성",
      "stage": "reviewed",
      "decision": "PASS",
      "total_score": 89,
      "harness_score": 74,
      "priority": null,
      "blocked": false,
      "blockers": [],
      "inbox_refs": [],
      "dashboard_synced_at": null,
      "attempt": 1,
      "updated_at": "2026-05-08T20:40:00.000Z",
      "strengths": [],
      "weaknesses": [],
      "deductions": [
        {
          "category": "result_quality",
          "points": 8,
          "reason": "Next.js build 경고가 남아 후속 정리가 가능하다."
        },
        {
          "category": "result_quality",
          "points": 8,
          "reason": "db:status는 Docker 없는 환경에서 상태 메시지로 흡수하는 방식이라 실제 스택 점검은 환경 의존적이다."
        },
        {
          "category": "process_quality",
          "points": 3,
          "reason": "초기 설치에서 TLS 인증서 문제를 우회해야 했다."
        },
        {
          "category": "process_quality",
          "points": 3,
          "reason": "검증 과정에서 환경 의존 경고와 경로 조정이 있었다."
        }
      ],
      "categories": [
        {
          "id": "result_quality",
          "label": "result_quality",
          "score": 62,
          "max": 70
        },
        {
          "id": "process_quality",
          "label": "process_quality",
          "score": 27,
          "max": 30
        }
      ]
    }
  ],
  "harness_health": {
    "total_score": 74,
    "categories": [
      {
        "label": "Task spec quality",
        "score": 17,
        "max": 20,
        "evidence": [
          "task-spec.md가 목표, 범위, 제외 범위, 검증 방법, 완료 기준, 리스크를 실행 가능한 수준으로 정리했다.",
          "첫 스캐폴드 작업임에도 제품 기능 제외 범위가 명확했다."
        ],
        "deductions": [
          "초기 완료 기준에 대시보드 갱신과 CI/커밋 정책의 세부 성공 조건이 충분히 구체화되지는 않았다."
        ]
      },
      {
        "label": "Context injection quality",
        "score": 15,
        "max": 20,
        "evidence": [
          "GitHub Issue, task-spec, plan, spec가 구현 단계에 필요한 기본 맥락을 제공했다.",
          "사전 결정 사항은 이후 spec/status 스킬 보강으로 더 명확해졌다."
        ],
        "deductions": [
          "초기 실행 당시 폴더 구조, 네이밍, CI 범위 같은 결정 항목을 자동으로 질문 큐화하는 절차가 약했다.",
          "작업 중 추가 항목과 inbox 연결 규칙은 실행 이후에 보강됐다."
        ]
      },
      {
        "label": "Role handoff quality",
        "score": 12,
        "max": 15,
        "evidence": [
          "Red, Green, Verify, Review 산출물이 순서대로 남아 있고 Reviewer가 PASS 결정을 내렸다.",
          "Green 이후 Verify 대응 리워크가 implementation-notes.md에 기록됐다."
        ],
        "deductions": [
          "verification.md 안에 중간 FAIL/PARTIAL 매핑과 최종 PASS 요약이 함께 남아 있어 후속 독자가 최종 상태를 빠르게 판단하기 어렵다."
        ]
      },
      {
        "label": "Verification gate quality",
        "score": 13,
        "max": 20,
        "evidence": [
          "lint, format, typecheck, test, build, db:status, commitlint 샘플을 실행했고 최종 PASS 기록이 있다.",
          "PR 브랜치에서 CI 실패 원인을 확인해 commitlint revision range 문제를 제거했다."
        ],
        "deductions": [
          "초기 PR CI가 commitlint revision range 문제로 실패해 로컬 검증과 CI 검증 사이의 차이를 사전에 잡지 못했다.",
          "Windows 줄끝과 Prettier check 불일치도 PR 브랜치에서 뒤늦게 발견됐다.",
          "db:status는 실제 Supabase 스택 상태가 아니라 wrapper 메시지 성공이라 검증 강도가 낮다."
        ]
      },
      {
        "label": "Scoring rubric quality",
        "score": 12,
        "max": 15,
        "evidence": [
          "review-score.json이 result_quality와 process_quality를 분리하고 감점 사유를 남겼다.",
          "PASS/REWORK/FAIL 기준은 명확하게 적용됐다."
        ],
        "deductions": [
          "단일 실행 기준이라 반복 패턴을 판단하기 어렵고, CI 사후 실패가 리뷰 점수에 충분히 반영되지 않았다."
        ]
      },
      {
        "label": "Record and dashboard quality",
        "score": 5,
        "max": 10,
        "evidence": [
          "대시보드 데이터는 issue-24 PASS와 89점을 표시하도록 갱신됐다.",
          "닫힌 issue-23 실행 산출물은 제거됐다."
        ],
        "deductions": [
          "하네스 건강도 산출물이 없을 때 대시보드가 0점으로만 표시해 누락인지 실제 0점인지 구분하기 어렵다.",
          "대시보드 갱신 단계가 건강도 산출물 부재를 먼저 보고하지 않았다."
        ]
      }
    ],
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
