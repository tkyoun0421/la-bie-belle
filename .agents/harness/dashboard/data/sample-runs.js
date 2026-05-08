window.AI_HARNESS_SAMPLE_RUNS = {
  generated_at: "2026-05-08T00:00:00+09:00",
  summary: {
    issue_count: 6,
    average_issue_score: 81,
    pass_count: 3,
    rework_count: 2,
    fail_count: 1,
    average_harness_score: 74
  },
  runs: [
    {
      issue_number: 24,
      title: "결제 버튼 문구 수정",
      decision: "PASS",
      total_score: 88,
      harness_score: 78,
      attempt: 1,
      updated_at: "2026-05-08T13:20:00+09:00",
      strengths: ["요구사항 범위 안에서 변경됨", "검증 결과가 완료 기준과 명확히 연결됨"],
      weaknesses: ["인수인계 메모에 UI 확인 환경이 부족함"],
      deductions: [
        { category: "기록과 인수인계 품질", points: 2, reason: "수동 확인 브라우저/viewport 기록 누락" }
      ],
      categories: [
        { id: "requirement_fulfillment", label: "요구사항 충족도", score: 24, max: 25 },
        { id: "scope_control", label: "범위 준수", score: 15, max: 15 },
        { id: "implementation_quality", label: "구현 품질", score: 14, max: 15 },
        { id: "verification_sufficiency", label: "검증 충분성", score: 9, max: 10 },
        { id: "risk_and_safety", label: "리스크와 안전성", score: 5, max: 5 },
        { id: "requirement_interpretation", label: "요구사항 해석 품질", score: 9, max: 10 },
        { id: "plan_appropriateness", label: "계획 적절성", score: 7, max: 8 },
        { id: "context_usage", label: "컨텍스트 활용", score: 5, max: 6 },
        { id: "handoff_quality", label: "기록과 인수인계 품질", score: 5, max: 6 }
      ]
    },
    {
      issue_number: 25,
      title: "상품 카드 레이아웃 정리",
      decision: "REWORK",
      total_score: 72,
      harness_score: 69,
      attempt: 1,
      updated_at: "2026-05-08T14:10:00+09:00",
      strengths: ["기본 구현 방향은 맞음", "관련 컴포넌트를 정확히 찾음"],
      weaknesses: ["모바일 viewport 검증이 부족함", "범위 밖 spacing 변경이 포함됨"],
      deductions: [
        { category: "범위 준수", points: 5, reason: "요청하지 않은 전역 간격 변경 포함" },
        { category: "검증 충분성", points: 4, reason: "모바일 화면 확인 근거 없음" }
      ],
      categories: [
        { id: "requirement_fulfillment", label: "요구사항 충족도", score: 20, max: 25 },
        { id: "scope_control", label: "범위 준수", score: 10, max: 15 },
        { id: "implementation_quality", label: "구현 품질", score: 12, max: 15 },
        { id: "verification_sufficiency", label: "검증 충분성", score: 6, max: 10 },
        { id: "risk_and_safety", label: "리스크와 안전성", score: 4, max: 5 },
        { id: "requirement_interpretation", label: "요구사항 해석 품질", score: 8, max: 10 },
        { id: "plan_appropriateness", label: "계획 적절성", score: 6, max: 8 },
        { id: "context_usage", label: "컨텍스트 활용", score: 4, max: 6 },
        { id: "handoff_quality", label: "기록과 인수인계 품질", score: 2, max: 6 }
      ]
    },
    {
      issue_number: 26,
      title: "하네스 평가 루브릭 초안",
      decision: "PASS",
      total_score: 84,
      harness_score: 82,
      attempt: 1,
      updated_at: "2026-05-08T15:05:00+09:00",
      strengths: ["결과물/과정 점수 분리가 명확함", "하네스 개선 제안 흐름이 포함됨"],
      weaknesses: ["실제 실행 데이터 연결은 아직 없음"],
      deductions: [
        { category: "검증 충분성", points: 3, reason: "실제 run record 샘플 검증 미구현" }
      ],
      categories: [
        { id: "requirement_fulfillment", label: "요구사항 충족도", score: 23, max: 25 },
        { id: "scope_control", label: "범위 준수", score: 14, max: 15 },
        { id: "implementation_quality", label: "구현 품질", score: 13, max: 15 },
        { id: "verification_sufficiency", label: "검증 충분성", score: 7, max: 10 },
        { id: "risk_and_safety", label: "리스크와 안전성", score: 5, max: 5 },
        { id: "requirement_interpretation", label: "요구사항 해석 품질", score: 9, max: 10 },
        { id: "plan_appropriateness", label: "계획 적절성", score: 7, max: 8 },
        { id: "context_usage", label: "컨텍스트 활용", score: 4, max: 6 },
        { id: "handoff_quality", label: "기록과 인수인계 품질", score: 2, max: 6 }
      ]
    },
    {
      issue_number: 27,
      title: "검색 필터 상태 보존",
      decision: "FAIL",
      total_score: 58,
      harness_score: 62,
      attempt: 1,
      updated_at: "2026-05-08T15:40:00+09:00",
      strengths: ["문제 파일 후보를 일부 찾음"],
      weaknesses: ["요구사항을 잘못 해석함", "상태 저장 위치가 기존 패턴과 다름", "검증 근거가 부족함"],
      deductions: [
        { category: "요구사항 충족도", points: 12, reason: "URL query 보존 요구를 local state 보존으로 오해" },
        { category: "컨텍스트 활용", points: 5, reason: "기존 라우팅 패턴 미확인" }
      ],
      categories: [
        { id: "requirement_fulfillment", label: "요구사항 충족도", score: 13, max: 25 },
        { id: "scope_control", label: "범위 준수", score: 9, max: 15 },
        { id: "implementation_quality", label: "구현 품질", score: 9, max: 15 },
        { id: "verification_sufficiency", label: "검증 충분성", score: 5, max: 10 },
        { id: "risk_and_safety", label: "리스크와 안전성", score: 4, max: 5 },
        { id: "requirement_interpretation", label: "요구사항 해석 품질", score: 4, max: 10 },
        { id: "plan_appropriateness", label: "계획 적절성", score: 5, max: 8 },
        { id: "context_usage", label: "컨텍스트 활용", score: 1, max: 6 },
        { id: "handoff_quality", label: "기록과 인수인계 품질", score: 3, max: 6 }
      ]
    },
    {
      issue_number: 28,
      title: "README 운영 절차 보강",
      decision: "PASS",
      total_score: 91,
      harness_score: 80,
      attempt: 1,
      updated_at: "2026-05-08T16:15:00+09:00",
      strengths: ["문서 범위가 명확함", "완료 기준과 변경 내용이 잘 대응됨"],
      weaknesses: ["대시보드 연결 항목은 후속 작업으로 남음"],
      deductions: [
        { category: "계획 적절성", points: 1, reason: "후속 작업 분리 근거가 짧음" }
      ],
      categories: [
        { id: "requirement_fulfillment", label: "요구사항 충족도", score: 25, max: 25 },
        { id: "scope_control", label: "범위 준수", score: 15, max: 15 },
        { id: "implementation_quality", label: "구현 품질", score: 14, max: 15 },
        { id: "verification_sufficiency", label: "검증 충분성", score: 9, max: 10 },
        { id: "risk_and_safety", label: "리스크와 안전성", score: 5, max: 5 },
        { id: "requirement_interpretation", label: "요구사항 해석 품질", score: 10, max: 10 },
        { id: "plan_appropriateness", label: "계획 적절성", score: 7, max: 8 },
        { id: "context_usage", label: "컨텍스트 활용", score: 3, max: 6 },
        { id: "handoff_quality", label: "기록과 인수인계 품질", score: 3, max: 6 }
      ]
    },
    {
      issue_number: 29,
      title: "검증 로그 요약 포맷",
      decision: "REWORK",
      total_score: 75,
      harness_score: 71,
      attempt: 2,
      updated_at: "2026-05-08T17:00:00+09:00",
      strengths: ["재작업 후 테스트 결과 기록이 개선됨"],
      weaknesses: ["실패 로그와 해결 로그의 연결이 아직 약함"],
      deductions: [
        { category: "기록과 인수인계 품질", points: 3, reason: "1차 실패 원인과 2차 수정 근거 연결 부족" }
      ],
      categories: [
        { id: "requirement_fulfillment", label: "요구사항 충족도", score: 21, max: 25 },
        { id: "scope_control", label: "범위 준수", score: 13, max: 15 },
        { id: "implementation_quality", label: "구현 품질", score: 12, max: 15 },
        { id: "verification_sufficiency", label: "검증 충분성", score: 7, max: 10 },
        { id: "risk_and_safety", label: "리스크와 안전성", score: 4, max: 5 },
        { id: "requirement_interpretation", label: "요구사항 해석 품질", score: 8, max: 10 },
        { id: "plan_appropriateness", label: "계획 적절성", score: 6, max: 8 },
        { id: "context_usage", label: "컨텍스트 활용", score: 3, max: 6 },
        { id: "handoff_quality", label: "기록과 인수인계 품질", score: 1, max: 6 }
      ]
    }
  ],
  harness_health: {
    total_score: 74,
    categories: [
      { label: "작업 명세 품질", score: 16, max: 20 },
      { label: "컨텍스트 주입 품질", score: 13, max: 20 },
      { label: "역할 분리와 인수인계 품질", score: 11, max: 15 },
      { label: "검증 게이트 품질", score: 14, max: 20 },
      { label: "스코어링 루브릭 품질", score: 12, max: 15 },
      { label: "기록과 대시보드 품질", score: 8, max: 10 }
    ],
    proposals: [
      {
        target_area: "context_injection",
        title: "Planner 단계에서 관련 파일 자동 수집 규칙 추가",
        reason: "컨텍스트 활용 감점이 반복됨",
        expected_impact: "요구사항 해석과 구현 품질 점수 안정화"
      },
      {
        target_area: "verification_gate",
        title: "viewport 검증 체크리스트를 Verifier 출력에 추가",
        reason: "UI 작업에서 검증 충분성 감점이 반복됨",
        expected_impact: "REWORK 비율 감소"
      }
    ]
  },
  agents: [
    {
      name: "Planner",
      file: ".agents/harness/agents/planner.agent.md",
      purpose: "GitHub Issue를 실행 가능한 작업 명세와 계획으로 변환",
      outputs: ["task-spec.md", "plan.md"],
      handoff: "필수 필드와 계획이 준비되면 Implementer로 전달"
    },
    {
      name: "Spec",
      file: ".agents/skills/ai-harness-spec/SKILL.md",
      purpose: "생성된 이슈를 상세 스펙과 테스트 케이스로 구체화",
      outputs: ["spec.md"],
      handoff: "상세 스펙과 Red 우선순위가 준비되면 Red 단계로 전달"
    },
    {
      name: "Implementer",
      file: ".agents/harness/agents/implementer.agent.md",
      purpose: "작업 명세와 계획에 맞춰 코드 또는 설정 변경 구현",
      outputs: ["implementation-notes.md"],
      handoff: "변경과 구현 기록이 준비되면 Verifier로 전달"
    },
    {
      name: "Refactor",
      file: ".agents/skills/ai-harness-refactor/SKILL.md",
      purpose: "Green 이후 동작 변경 없이 구조 개선",
      outputs: ["implementation-notes.md"],
      handoff: "리팩토링 수행 또는 생략 사유가 기록되면 Verifier로 전달"
    },
    {
      name: "Verifier",
      file: ".agents/harness/agents/verifier.agent.md",
      purpose: "완료 기준에 맞춰 테스트, 린트, 빌드, 수동 확인 근거 기록",
      outputs: ["verification.md"],
      handoff: "검증 결과와 diff 입력이 준비되면 Reviewer로 전달"
    },
    {
      name: "Reviewer",
      file: ".agents/harness/agents/reviewer.agent.md",
      purpose: "100점 루브릭으로 자동 채점하고 Draft PR 전 게이트 결정",
      outputs: ["review-score.json", "review.md"],
      handoff: "PASS는 Draft PR, REWORK는 Implementer, FAIL은 사람 확인으로 전달"
    },
    {
      name: "Draft PR",
      file: ".agents/harness/agents/draft-pr.agent.md",
      purpose: "PASS된 작업을 Draft PR로 정리",
      outputs: ["draft-pr.md"],
      handoff: "Ready 전환, 머지, 배포는 사람 승인 대기"
    },
    {
      name: "Harness Evaluator",
      file: ".agents/harness/agents/harness-evaluator.agent.md",
      purpose: "하네스 건강도를 평가하고 개선안을 제안",
      outputs: ["harness-health-score.json", "harness-improvements.md"],
      handoff: "개선안은 사람 승인 후 별도 Draft PR로 구현"
    }
  ],
  workflow: [
    { step: "1", name: "Planner", status: "task-spec.md / plan.md 생성" },
    { step: "2", name: "Spec", status: "spec.md 생성 / 테스트 케이스와 Red 우선순위 정리" },
    { step: "3", name: "Red", status: "실패 테스트 작성 / 실패 확인" },
    { step: "4", name: "Green", status: "최소 구현 / Red 테스트 통과" },
    { step: "5", name: "Refactor", status: "조건부 구조 개선 / 동작 변경 금지" },
    { step: "6", name: "Verifier", status: "검증 실행 / verification.md 생성" },
    { step: "7", name: "Reviewer", status: "자동 채점 / PASS, REWORK, FAIL 결정" },
    { step: "8", name: "Rework Loop", status: "REWORK면 재작업 후 재채점" },
    { step: "9", name: "Draft PR", status: "PASS일 때만 Draft PR 생성" },
    { step: "10", name: "Harness Evaluator", status: "하네스 건강도 평가 / 개선안 제안" }
  ]
};
