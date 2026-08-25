# 계획

task는 제목 한 줄과 완료 조건으로 이뤄진다. 완료 조건은 코드가 생기기 전에 총괄이 쓴다. 끝난 task는 완료로 내리고 로그 링크를 단다.

## 다음

- [ ] 급여 규칙을 확정한다 — 법정 기준 확인을 포함한다
  - 완료 조건: `docs/domain/payroll.md`의 "아직 안 정한 것"이 빈다. 연장 기준 시간, 가산 중복 여부, 야간 가산, 주휴수당, 휴게 공제, 5인 이상 여부 여섯을 근로기준법과 맞춰 정하고 어긋난 자리는 왜 그렇게 정했는지를 같이 남긴다. 세전·실지급 구분과 주 경계·지급일·시급 소급도 정해진다.
- [ ] 계정과 근무표 규칙을 확정한다
  - 완료 조건: `docs/domain/account.md`와 `docs/domain/schedule.md`의 "아직 안 정한 것"이 빈다. 첫 관리자 부트스트랩, 가입 거절, 퇴사자 보존, 근무자가 남의 근무를 보는 범위 넷이 여기 들어간다.
- [ ] 교대와 출근과 알림 규칙을 확정한다
  - 완료 조건: `docs/domain/swap.md`와 `docs/domain/attendance.md`와 `docs/domain/notification.md`의 "아직 안 정한 것"이 빈다. QR 위조 대응과 iOS PWA 푸시 제약 대응이 여기 들어간다.
- [ ] 디자인 레퍼런스 검토 — 시안 방향을 사람이 정한다
  - 완료 조건: 방향 결정과 근거 레퍼런스가 `docs/design-system/`에 기록된다.

## 진행

(없음)

## 완료

- [x] 도메인 규칙의 집을 `docs/domain/`으로 정한다 (ADR-004) — PRD에서 규칙을 빼고 영역별 파일 여섯으로 나눴다
- [x] Supabase 바탕과 integration 테스트 층을 세운다 — [docs/log/2026-08-26.md](log/2026-08-26.md)
  - 완료 조건: `supabase start`로 뜬 로컬 DB에 붙는 integration 테스트가 하나 이상 초록불이고, `pnpm test:integration`과 CI의 integration 단계가 돈다. `tdd-guard-unit.py`가 `__tests__/<이름>.integration.test.ts`를 짝으로 인정한다.
- [x] 영속과 인증을 Supabase로 정한다 (ADR-003) — [docs/log/2026-08-26.md](log/2026-08-26.md)
- [x] integration 층에 손과 계획을 붙인다 (`integration-test-writer` 신설, `test-planner`와 `implementer` 정의문 보강) — [docs/log/2026-08-26.md](log/2026-08-26.md)
- [x] SDD·DDD·TDD 자리를 ADR-002로 정한다 — [docs/log/2026-08-25-6.md](log/2026-08-25-6.md)
- [x] PRD 작성 — 제품 인터뷰로 요구를 확정한다 — [docs/log/2026-08-25-6.md](log/2026-08-25-6.md)
- [x] 테스트 계획·작성 분리와 회차 마감 위임 — [docs/log/2026-08-25-5.md](log/2026-08-25-5.md)
- [x] subagent 여섯과 FSD 배치, TDD 훅 — [docs/log/2026-08-25-4.md](log/2026-08-25-4.md)
- [x] 프로젝트 스캐폴드 — [docs/log/2026-08-25-3.md](log/2026-08-25-3.md)
- [x] 협업 구조 확정 — [docs/log/2026-08-25.md](log/2026-08-25.md)
