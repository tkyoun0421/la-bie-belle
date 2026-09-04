---
status: approved
---

# spec 승인 게이트와 문서 구조 검사를 단다

ADR-005 이행 5단계다. 승인 근거: 게이트 식별 방식(브랜치 이름 규약)을 태관이 2026-09-04 대화에서 골랐다.

## 완료 조건

- `feat/<슬러그>` 브랜치에서 `src/`를 고칠 때, `docs/2-design/spec/<슬러그>.md`가 없거나 프론트매터 `status`가 `approved`가 아니면 훅이 그 수정을 막는다. `feat/`가 아닌 브랜치는 안 막는다.
- CLAUDE.md 문서 지도가 가리키는 `docs/` 경로 중 실제로 없는 것이 있으면 `pnpm test`가 실패한다.
- 옮기기 전 경로(`docs/plan.md` · `docs/prd.md` · `docs/domain` · `docs/adr/` · `docs/spec/` · `docs/design-system/`)가 문서·정의문·코드에 남아 있으면 `pnpm test`가 실패한다. 예외 둘 — `docs/log/`는 당시 사실의 기록이고, 역사 서술로 명시한 자리(ADR-004의 결정 문장)는 허용 목록으로 뺀다.
- 규칙마다 위반 픽스처와 그 규칙이 실제로 발동하는지 확인하는 테스트가 있다. 기존 lint 기계화 task와 같은 방식이다.

## 범위 밖

CHANGELOG 갱신 누락 검사 — 후보로만 기록하고 이번에 안 단다. 상처가 나면 그때 단다.
