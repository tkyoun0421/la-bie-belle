window.AI_HARNESS_RUNS = {
  "generated_at": "2026-05-12T05:43:54.119Z",
  "summary": {
    "issue_count": 2,
    "average_issue_score": 92,
    "pass_count": 2,
    "rework_count": 0,
    "fail_count": 0,
    "average_harness_score": null
  },
  "runs": [
    {
      "issue_number": 45,
      "title": "[Harness] 실제 실행 run 기준으로 상태 표시 개선",
      "stage": "reviewed",
      "decision": "PASS",
      "total_score": 91,
      "review_complete": true,
      "data_quality_warnings": [],
      "harness_score": null,
      "priority": null,
      "blocked": false,
      "blockers": [],
      "inbox_refs": [],
      "dashboard_synced_at": null,
      "attempt": 1,
      "updated_at": "2026-05-12T05:50:00.000Z",
      "strengths": [
        "템플릿만 있는 run이 더 이상 reviewed FAIL 결과로 표시되지 않는다.",
        "dashboard 요약이 누락된 review 데이터와 실제 0점을 구분한다."
      ],
      "weaknesses": [
        "템플릿 판별 로직이 두 스크립트에 중복되어 있다.",
        "전용 자동화 단위 테스트는 추가하지 않았다."
      ],
      "deductions": [
        {
          "category": "요구사항 충족",
          "points": 1,
          "reason": "dashboard UI 전면 렌더링 개편은 하지 않았고, 이번 이슈는 생성 데이터와 status 출력 기준에 집중했다."
        },
        {
          "category": "구현 품질",
          "points": 1,
          "reason": "템플릿 판별 로직이 공통 모듈로 분리되지 않고 두 스크립트에 중복되어 있다."
        },
        {
          "category": "검증 충분성",
          "points": 1,
          "reason": "별도 자동화 단위 테스트 파일은 추가하지 않았다."
        },
        {
          "category": "컨텍스트 활용",
          "points": 2,
          "reason": "작업 당시 develop 기반 PR #50이 열려 있어 추가 커밋이 같은 PR에 반영될 수 있는 상황이었다."
        },
        {
          "category": "인수인계 품질",
          "points": 4,
          "reason": "실수로 생성된 issue-38 로컬 run은 별도 정리 항목으로 남아 있었다."
        }
      ],
      "categories": [
        {
          "id": "requirement_fulfillment",
          "label": "요구사항 충족",
          "score": 24,
          "max": 25
        },
        {
          "id": "scope_control",
          "label": "범위 통제",
          "score": 15,
          "max": 15
        },
        {
          "id": "implementation_quality",
          "label": "구현 품질",
          "score": 14,
          "max": 15
        },
        {
          "id": "verification_sufficiency",
          "label": "검증 충분성",
          "score": 9,
          "max": 10
        },
        {
          "id": "risk_and_safety",
          "label": "리스크와 안전",
          "score": 5,
          "max": 5
        },
        {
          "id": "requirement_interpretation",
          "label": "요구사항 해석",
          "score": 10,
          "max": 10
        },
        {
          "id": "plan_appropriateness",
          "label": "계획 적절성",
          "score": 8,
          "max": 8
        },
        {
          "id": "context_usage",
          "label": "컨텍스트 활용",
          "score": 4,
          "max": 6
        },
        {
          "id": "handoff_quality",
          "label": "인수인계 품질",
          "score": 2,
          "max": 6
        }
      ]
    },
    {
      "issue_number": 44,
      "title": "[Harness] Inbox 처리 정책 문서화",
      "stage": "reviewed",
      "decision": "PASS",
      "total_score": 92,
      "review_complete": true,
      "data_quality_warnings": [],
      "harness_score": null,
      "priority": null,
      "blocked": false,
      "blockers": [],
      "inbox_refs": [],
      "dashboard_synced_at": null,
      "attempt": 1,
      "updated_at": "2026-05-12T05:30:00.000Z",
      "strengths": [
        "inbox 분류, PR 전 처리, 제거 기준을 다루는 중앙 정책 문서가 추가됐다.",
        "기존 스킬과 workflow 문서가 느슨한 표현 대신 같은 정책 문서를 참조하게 됐다."
      ],
      "weaknesses": [
        "아직 자동 강제 로직은 없다.",
        "실수로 시작한 issue-38 run이 로컬 하네스 노이즈로 남아 있었다."
      ],
      "deductions": [
        {
          "category": "요구사항 충족",
          "points": 1,
          "reason": "이번 범위에 맞춰 자동 강제 로직은 추가하지 않았고, 준수 여부는 스킬 실행 단계에 남아 있다."
        },
        {
          "category": "구현 품질",
          "points": 1,
          "reason": "정책 문서 일부가 영어라 한글 하네스 문서와 언어가 섞여 있다."
        },
        {
          "category": "검증 충분성",
          "points": 1,
          "reason": "문서 변경만 포함하므로 build/test/lint는 생략했다."
        },
        {
          "category": "컨텍스트 활용",
          "points": 2,
          "reason": "사용자가 #44로 방향을 바꾸기 전에 issue-38 run을 실수로 시작했다."
        },
        {
          "category": "인수인계 품질",
          "points": 3,
          "reason": "실수로 생성된 issue-38 run은 별도 정리가 필요한 상태로 남아 있었다."
        }
      ],
      "categories": [
        {
          "id": "requirement_fulfillment",
          "label": "요구사항 충족",
          "score": 24,
          "max": 25
        },
        {
          "id": "scope_control",
          "label": "범위 통제",
          "score": 15,
          "max": 15
        },
        {
          "id": "implementation_quality",
          "label": "구현 품질",
          "score": 14,
          "max": 15
        },
        {
          "id": "verification_sufficiency",
          "label": "검증 충분성",
          "score": 9,
          "max": 10
        },
        {
          "id": "risk_and_safety",
          "label": "리스크와 안전",
          "score": 5,
          "max": 5
        },
        {
          "id": "requirement_interpretation",
          "label": "요구사항 해석",
          "score": 10,
          "max": 10
        },
        {
          "id": "plan_appropriateness",
          "label": "계획 적절성",
          "score": 8,
          "max": 8
        },
        {
          "id": "context_usage",
          "label": "컨텍스트 활용",
          "score": 4,
          "max": 6
        },
        {
          "id": "handoff_quality",
          "label": "인수인계 품질",
          "score": 3,
          "max": 6
        }
      ]
    },
    {
      "run_id": "issue-24",
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
      "attempt": 1,
      "updated_at": "2026-05-08T20:40:00.000Z",
      "archived_at": "2026-05-11T05:32:47.368Z",
      "source": {
        "type": "local-run",
        "path": ".agents/runs/issue-24"
      },
      "strengths": [],
      "weaknesses": [],
      "deductions": [
        {
          "category": "결과 품질",
          "points": 8,
          "reason": "Next.js build 경고가 남아 후속 정리가 가능하다."
        },
        {
          "category": "결과 품질",
          "points": 8,
          "reason": "db:status는 Docker 없는 환경에서 상태 메시지로 흡수하는 방식이라 실제 스택 점검은 환경 의존적이다."
        },
        {
          "category": "프로세스 품질",
          "points": 3,
          "reason": "초기 설치에서 TLS 인증서 문제를 우회해야 했다."
        },
        {
          "category": "프로세스 품질",
          "points": 3,
          "reason": "검증 과정에서 환경 의존 경고와 경로 조정이 있었다."
        }
      ],
      "categories": [
        {
          "id": "result_quality",
          "label": "결과 품질",
          "score": 62,
          "max": 70
        },
        {
          "id": "process_quality",
          "label": "프로세스 품질",
          "score": 27,
          "max": 30
        }
      ],
      "harness_health": {
        "total_score": 74,
        "categories": [
          {
            "id": "task_spec_quality",
            "label": "작업 명세 품질",
            "score": 17,
            "max_score": 20,
            "evidence": [
              "task-spec.md가 목표, 범위, 제외 범위, 검증 방법, 완료 기준, 리스크를 실행 가능한 수준으로 정리했다.",
              "첫 스캐폴드 작업임에도 제품 기능 제외 범위가 명확했다."
            ],
            "deductions": [
              "초기 완료 기준에 대시보드 갱신과 CI/커밋 정책의 세부 성공 조건이 충분히 구체화되지는 않았다."
            ]
          },
          {
            "id": "context_injection_quality",
            "label": "컨텍스트 주입 품질",
            "score": 15,
            "max_score": 20,
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
            "id": "role_handoff_quality",
            "label": "역할 분리와 인수인계 품질",
            "score": 12,
            "max_score": 15,
            "evidence": [
              "Red, Green, Verify, Review 산출물이 순서대로 남아 있고 Reviewer가 PASS 결정을 내렸다.",
              "Green 이후 Verify 대응 리워크가 implementation-notes.md에 기록됐다."
            ],
            "deductions": [
              "verification.md 안에 중간 FAIL/PARTIAL 매핑과 최종 PASS 요약이 함께 남아 있어 후속 독자가 최종 상태를 빠르게 판단하기 어렵다."
            ]
          },
          {
            "id": "verification_gate_quality",
            "label": "검증 게이트 품질",
            "score": 13,
            "max_score": 20,
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
            "id": "scoring_rubric_quality",
            "label": "스코어링 루브릭 품질",
            "score": 12,
            "max_score": 15,
            "evidence": [
              "review-score.json이 result_quality와 process_quality를 분리하고 감점 사유를 남겼다.",
              "PASS/REWORK/FAIL 기준은 명확하게 적용됐다."
            ],
            "deductions": [
              "단일 실행 기준이라 반복 패턴을 판단하기 어렵고, CI 사후 실패가 리뷰 점수에 충분히 반영되지 않았다."
            ]
          },
          {
            "id": "record_and_dashboard_quality",
            "label": "기록과 대시보드 품질",
            "score": 5,
            "max_score": 10,
            "evidence": [
              "대시보드 데이터는 issue-24 PASS와 89점을 표시하도록 갱신됐다.",
              "닫힌 issue-23 실행 산출물은 제거됐다."
            ],
            "deductions": [
              "하네스 건강도 산출물이 없을 때 대시보드가 0점으로만 표시해 누락인지 실제 0점인지 구분하기 어렵다.",
              "대시보드 갱신 단계가 건강도 산출물 부재를 먼저 보고하지 않았다."
            ]
          }
        ]
      },
      "archived": true
    }
  ],
  "harness_health": {
    "total_score": null,
    "missing": true,
    "categories": [],
    "proposals": [
      {
        "proposal_id": "2026-05-10-dashboard-health-missing-state",
        "target_area": "record_dashboard",
        "title": "2026-05-10-dashboard-health-missing-state",
        "reason": "harness-health-score.json이 없을 때 dashboard data가 average_harness_score 또는 harness_health.total_score를 0처럼 표시할 수 있다. 그러면 평가 누락과 실제 0점을 구분하기 어렵다.",
        "expected_impact": "사용자가 하네스 건강도 평가 누락을 빠르게 알아차리고, 누락 데이터를 유효 점수로 오해하지 않는다.",
        "status": "proposed",
        "file": ".agents/harness/improvements/proposals/2026-05-10-dashboard-health-missing-state.json"
      },
      {
        "proposal_id": "2026-05-10-verification-ci-parity",
        "target_area": "verification_gate",
        "title": "2026-05-10-verification-ci-parity",
        "reason": "Issue #24는 로컬 검증을 통과했지만 PR 시점 CI에서 commitlint revision range 처리와 포맷 차이 같은 설정 문제가 드러났다. 검증 단계가 로컬 명령 결과와 PR CI 준비 상태를 명확히 분리하지 못했다.",
        "expected_impact": "PR 생성 전에 CI 전용 실패 가능성을 고려하므로 리뷰 직후 머지 가능한 PR 비율이 높아진다.",
        "status": "proposed",
        "file": ".agents/harness/improvements/proposals/2026-05-10-verification-ci-parity.json"
      }
    ]
  },
  "agents": [
    {
      "name": "Planner",
      "file": ".agents/harness/agents/planner.agent.md",
      "purpose": "GitHub Issue를 task-spec.md와 plan.md로 변환한다.",
      "outputs": [
        "task-spec.md",
        "plan.md"
      ],
      "handoff": "구체화된 작업 명세와 계획을 구현 단계로 넘긴다."
    },
    {
      "name": "Spec",
      "file": ".agents/skills/ai-harness-spec/SKILL.md",
      "purpose": "구현 전에 미확정 결정을 정리하고 spec.md를 작성한다.",
      "outputs": [
        "spec.md"
      ],
      "handoff": "상세 시나리오와 Red 우선순위를 Red 단계로 넘긴다."
    },
    {
      "name": "Implementer",
      "file": ".agents/harness/agents/implementer.agent.md",
      "purpose": "코드 또는 설정 변경을 구현한다.",
      "outputs": [
        "implementation-notes.md"
      ],
      "handoff": "변경 파일과 구현 기록을 검증 단계로 넘긴다."
    },
    {
      "name": "Verifier",
      "file": ".agents/harness/agents/verifier.agent.md",
      "purpose": "검증 명령을 실행하고 근거를 기록한다.",
      "outputs": [
        "verification.md"
      ],
      "handoff": "검증 근거와 diff 맥락을 리뷰 단계로 넘긴다."
    },
    {
      "name": "Reviewer",
      "file": ".agents/harness/agents/reviewer.agent.md",
      "purpose": "실행 결과를 채점하고 PASS, REWORK, FAIL을 결정한다.",
      "outputs": [
        "review-score.json",
        "review.md"
      ],
      "handoff": "PASS는 PR 단계로, REWORK는 구현 재작업으로, FAIL은 사람 확인으로 넘긴다."
    },
    {
      "name": "Harness Evaluator",
      "file": ".agents/harness/agents/harness-evaluator.agent.md",
      "purpose": "하네스 건강도를 평가하고 개선안을 제안한다.",
      "outputs": [
        "harness-health-score.json",
        "harness-improvements.md"
      ],
      "handoff": "승인된 개선안은 별도 작업으로 구현한다."
    }
  ],
  "workflow": [
    {
      "step": "1",
      "name": "Planner",
      "status": "task-spec.md와 plan.md 작성"
    },
    {
      "step": "2",
      "name": "Spec",
      "status": "spec.md와 Red 우선순위 작성"
    },
    {
      "step": "3",
      "name": "Red",
      "status": "실패 테스트를 작성하거나 실패 근거 기록"
    },
    {
      "step": "4",
      "name": "Green",
      "status": "통과에 필요한 최소 변경 구현"
    },
    {
      "step": "5",
      "name": "Verify",
      "status": "검증 실행 후 verification.md 작성"
    },
    {
      "step": "6",
      "name": "Review",
      "status": "점수 산정 후 PASS, REWORK, FAIL 결정"
    },
    {
      "step": "7",
      "name": "Dashboard",
      "status": "run 상태를 dashboard data로 변환"
    },
    {
      "step": "8",
      "name": "PR",
      "status": "PASS run만 PR로 정리"
    }
  ]
};
