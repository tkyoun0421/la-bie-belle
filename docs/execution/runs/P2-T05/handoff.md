# P2-T05 handoff

## 2026-08-08 · 개발 단계 안전 중단 (blocked)

- 작업 식별자: P2-T05 (모집 운영 화면과 테스트)
- 현재 단계: 개발(3단계) 착수 직후 안전 중단 → 다음 설계(2단계) 또는 기획(1단계) 반환(조정자 결정 대기)
- 기준 시각: 2026-08-08T00:25:54Z

### 확정된 사실

- RADIO `docs/execution/radio/P2-T05-radio.md` revision 2, SHA-256 `db59b1d46ae007e4841eff79457a33a3278712bd9c320601721e0aed35c4aa1f`는 index의 `development_approval`과 일치하고 `gate:radio` 통과 상태다. 봉인 본문은 이번 세션에서 수정하지 않았다.
- RADIO 기술 인수 조건 1(관리자 모집 달력 셀의 applied 신청 수 배지)을 구현하려면 `src/shared/ui/calendar.tsx`(달력 날짜 셀을 전담 렌더링하는 공용 컴포넌트)를 수정해야 하는데, 이 파일은 RADIO의 '변경 허용 경로' 코드펜스(`src/shared/config/**`만 있고 `src/shared/ui/**`는 없음)에 없다. `gate:scope`가 이 파일의 스테이징을 차단한다. 근거와 재현 경로는 `docs/execution/runs/P2-T05/decision-signal.json`에 남겼다.
- 기술 인수 조건 2(시트 신청 현황)·3(홈 카드)·4(CLOSED 상세)·5의 F-03(월 경계 시간대) 회귀·관련 pgTAP·entities/schedule 신규 조회 3종(`count-applications-by-month`·`list-applicants-by-schedule`·`find-imminent-recruitment`)은 `src/shared/ui`를 건드리지 않고 RADIO가 선언한 허용 경로만으로 구현 가능하다고 판단했다. 다만 기술 인수 조건 6(E2E 왕복)이 배지 확인 단계를 포함해, 1번을 분리하면 그 E2E 시나리오도 함께 손봐야 한다.
- 이번 세션에서 `src/` 아래 코드·테스트는 한 줄도 작성·스테이징하지 않았다. 읽기 전용 조사(RADIO·관련 코드·P2-T02 교차 검증 F-03 finding 등)만 수행했다.
- P2-T03·P2-T04는 모두 `done`으로 커밋돼 있어 이 RADIO가 전제한 시트(`RecruitmentManageSheet`)·달력(`RecruitmentOpenView`, `toRecruitmentCellStates` 등)·다중 신청(`applyRecruitmentChanges`) 산출물은 실물로 확인했다. RADIO 미결 사항("P2-T03·T04 재봉인 시 재점검")은 해당 없음 — 두 task는 봉인된 형태 그대로다.

### 미결 사항

- `src/shared/ui/calendar.tsx`(또는 `src/shared/ui/**`)를 변경 허용 경로에 추가하는 재봉인으로 해소할지, 배지 표시 위치를 바꾸는 기획 재검토로 갈지, 기술 인수 조건 1을 별도 task로 분리할지 — 결정 주체: 사용자(조정자 경유), 반환 단계: 설계(경로 추가만이면) 또는 기획(표시 위치 자체를 바꾸면). 선택지별 트레이드오프는 `decision-signal.json`의 `open_questions`에 정리했다.

### 다음 행동

1. 조정자가 위 미결 사항을 사용자에게 확인하고, 필요하면 RADIO를 재봉인하거나 기획 단계로 반환한다.
2. 재승인 후 개발 루프가 P2-T05를 다시 `planned`으로 올리고 이어서 실행한다. 이번 세션은 코드 작업물이 없어 이어받을 격리 작업물이 없다 — 다음 세션은 이 handoff와 decision-signal만 읽고 처음부터 구현을 시작하면 된다.

### 증거·산출물 경로

- `docs/execution/runs/P2-T05/decision-signal.json`
- `docs/execution/radio/P2-T05-radio.md` (봉인 본문 무수정 확인)
- `docs/execution/reviews/P2-T02-review.json`의 F-03 finding(월 경계 시간대) — 이번 조사에서 함께 확인한 관련 배경
