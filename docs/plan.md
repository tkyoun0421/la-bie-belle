# 계획

task는 제목 한 줄과 완료 조건으로 이뤄진다. 완료 조건은 코드가 생기기 전에 총괄이 쓴다. 끝난 task는 완료로 내리고 로그 링크를 단다.

## 다음

- [ ] Supabase 바탕과 integration 테스트 층을 세운다 — ADR-003이 정한 대로 깐다
  - 완료 조건: `supabase start`로 뜬 로컬 DB에 붙는 integration 테스트가 하나 이상 초록불이고, `pnpm test:integration`과 CI의 integration 단계가 돈다. `tdd-guard-unit.py`가 `__tests__/<이름>.integration.test.ts`를 짝으로 인정한다.
- [ ] 디자인 레퍼런스 검토 — 시안 방향을 사람이 정한다
  - 완료 조건: 방향 결정과 근거 레퍼런스가 `docs/design-system/`에 기록된다.

## 진행

(없음)

## 완료

- [x] SDD·DDD·TDD 자리를 ADR-002로 정한다 — [docs/log/2026-08-25-6.md](log/2026-08-25-6.md)
- [x] PRD 작성 — 제품 인터뷰로 요구를 확정한다 — [docs/log/2026-08-25-6.md](log/2026-08-25-6.md)
- [x] 테스트 계획·작성 분리와 회차 마감 위임 — [docs/log/2026-08-25-5.md](log/2026-08-25-5.md)
- [x] subagent 여섯과 FSD 배치, TDD 훅 — [docs/log/2026-08-25-4.md](log/2026-08-25-4.md)
- [x] 프로젝트 스캐폴드 — [docs/log/2026-08-25-3.md](log/2026-08-25-3.md)
- [x] 협업 구조 확정 — [docs/log/2026-08-25.md](log/2026-08-25.md)
