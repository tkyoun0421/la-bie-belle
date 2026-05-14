# 하네스 건강도 평가

## 총점

80/100

## 요약

#47은 dashboard data 품질과 다음 작업 후보 표시를 개선해 record/dashboard 품질을 끌어올렸다. 다만 사용자 결정이 필요한 상태에서 spec을 먼저 작성했다가 수정한 흐름은 하네스 역할 인수인계 품질의 명확한 약점으로 남았다.

## 강점

- active/archived run 구분과 데이터 품질 경고가 dashboard data에 들어갔다.
- GitHub 열린 이슈와 inbox 후보가 next-work 데이터로 노출된다.
- 새 `validate-dashboard-data.mjs`가 dashboard data 계약을 검증한다.

## 약점

- spec 작성 전에 사용자 결정 확인이 강제되지 않았다.
- Playwright snapshot 실패를 보완하는 DOM-level 브라우저 검증이 없다.
- 기존 dashboard 문구 인코딩 깨짐은 별도 정리가 필요하다.

## 개선 제안

- `2026-05-14-pre-spec-decision-gate`: spec 단계에서 미확정 결정이 있으면 `spec.md`를 쓰지 못하고 질문 상태로 남기도록 status/diagnose 또는 spec skill 체크를 강화한다.
