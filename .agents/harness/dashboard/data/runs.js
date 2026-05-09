window.AI_HARNESS_RUNS = {
  "generated_at": "2026-05-09T21:27:18.423Z",
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
      "decision": "PASS",
      "total_score": 89,
      "harness_score": 74,
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
        "label": "작업 명세 품질",
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
        "label": "컨텍스트 주입 품질",
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
        "label": "역할 분리와 인수인계 품질",
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
        "label": "검증 게이트 품질",
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
        "label": "스코어링 루브릭 품질",
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
        "label": "기록과 대시보드 품질",
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
        "target_area": "record_and_dashboard_quality",
        "title": "대시보드가 하네스 건강도 미평가 상태를 0점과 구분해 표시한다",
        "reason": "harness-health-score.json이 없을 때 대시보드는 average_harness_score와 harness_health.total_score를 0으로 표시한다. 이 값은 실제 0점인지 평가 미실행인지 구분하기 어렵다.",
        "expected_impact": "대시보드가 누락 산출물을 조기에 드러내고, 사용자가 건강도 평가를 놓치지 않는다.",
        "status": "proposed",
        "file": ".agents/harness/improvements/proposals/2026-05-10-dashboard-health-missing-state.json"
      },
      {
        "target_area": "verification_gate_quality",
        "title": "PR CI 조건을 검증 단계에서 사전 확인한다",
        "reason": "issue-24는 로컬 검증을 통과했지만 PR 생성 후 GitHub Actions commitlint revision range 오류가 발생했다. Windows 줄끝과 Prettier check 불일치도 PR 브랜치에서 뒤늦게 발견됐다.",
        "expected_impact": "PR 생성 후 CI에서 발견되는 설정성 실패를 줄이고, PR이 생성될 때 바로 머지 가능한 상태에 가까워진다.",
        "status": "proposed",
        "file": ".agents/harness/improvements/proposals/2026-05-10-verification-ci-parity.json"
      }
    ]
  },
  "agents": [
    {
      "name": "Planner",
      "file": ".agents/harness/agents/planner.agent.md",
      "purpose": "GitHub Issue를 실행 가능한 작업 명세와 계획으로 변환",
      "outputs": [
        "task-spec.md",
        "plan.md"
      ],
      "handoff": "필수 필드와 계획이 준비되면 Implementer로 전달"
    },
    {
      "name": "Spec",
      "file": ".agents/skills/ai-harness-spec/SKILL.md",
      "purpose": "생성된 이슈를 상세 스펙과 테스트 케이스로 구체화",
      "outputs": [
        "spec.md"
      ],
      "handoff": "상세 스펙과 Red 우선순위가 준비되면 Red 단계로 전달"
    },
    {
      "name": "Implementer",
      "file": ".agents/harness/agents/implementer.agent.md",
      "purpose": "작업 명세와 계획에 맞춰 코드 또는 설정 변경 구현",
      "outputs": [
        "implementation-notes.md"
      ],
      "handoff": "변경과 구현 기록이 준비되면 Verifier로 전달"
    },
    {
      "name": "Refactor",
      "file": ".agents/skills/ai-harness-refactor/SKILL.md",
      "purpose": "Green 이후 동작 변경 없이 구조 개선",
      "outputs": [
        "implementation-notes.md"
      ],
      "handoff": "리팩토링 수행 또는 생략 사유가 기록되면 Verifier로 전달"
    },
    {
      "name": "Verifier",
      "file": ".agents/harness/agents/verifier.agent.md",
      "purpose": "완료 기준에 맞춰 테스트, 린트, 빌드, 수동 확인 근거 기록",
      "outputs": [
        "verification.md"
      ],
      "handoff": "검증 결과와 diff 입력이 준비되면 Reviewer로 전달"
    },
    {
      "name": "Reviewer",
      "file": ".agents/harness/agents/reviewer.agent.md",
      "purpose": "100점 루브릭으로 자동 채점하고 PR 전 게이트 결정",
      "outputs": [
        "review-score.json",
        "review.md"
      ],
      "handoff": "PASS는 PR 생성, REWORK는 Implementer, FAIL은 사람 확인으로 전달"
    },
    {
      "name": "PR",
      "file": ".agents/harness/agents/draft-pr.agent.md",
      "purpose": "PASS된 작업을 바로 리뷰/머지 가능한 일반 PR로 정리",
      "outputs": [
        "draft-pr.md"
      ],
      "handoff": "머지와 배포는 사람 승인 대기"
    },
    {
      "name": "Harness Evaluator",
      "file": ".agents/harness/agents/harness-evaluator.agent.md",
      "purpose": "하네스 건강도를 평가하고 개선안을 제안",
      "outputs": [
        "harness-health-score.json",
        "harness-improvements.md"
      ],
      "handoff": "개선안은 사람 승인 후 별도 일반 PR로 구현"
    }
  ],
  "workflow": [
    {
      "step": "1",
      "name": "Planner",
      "status": "task-spec.md / plan.md 생성"
    },
    {
      "step": "2",
      "name": "Spec",
      "status": "spec.md 생성 / 테스트 케이스와 Red 우선순위 정리"
    },
    {
      "step": "3",
      "name": "Red",
      "status": "실패 테스트 작성 / 실패 확인"
    },
    {
      "step": "4",
      "name": "Green",
      "status": "최소 구현 / Red 테스트 통과"
    },
    {
      "step": "5",
      "name": "Refactor",
      "status": "조건부 구조 개선 / 동작 변경 금지"
    },
    {
      "step": "6",
      "name": "Verifier",
      "status": "검증 실행 / verification.md 생성"
    },
    {
      "step": "7",
      "name": "Reviewer",
      "status": "자동 채점 / PASS, REWORK, FAIL 결정"
    },
    {
      "step": "8",
      "name": "Rework Loop",
      "status": "REWORK면 재작업 후 재채점"
    },
    {
      "step": "9",
      "name": "PR",
      "status": "PASS일 때만 일반 PR 생성"
    },
    {
      "step": "10",
      "name": "Harness Evaluator",
      "status": "하네스 건강도 평가 / 개선안 제안"
    }
  ]
};
