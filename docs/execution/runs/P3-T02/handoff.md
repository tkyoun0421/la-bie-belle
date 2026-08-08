# P3-T02 handoff

## 2026-08-09 · 개발 단계 착수 직후 안전 중단 (blocked)

- 작업 식별자: P3-T02 (포지션 기본 설정과 스케줄 필요 인원)
- 현재 단계: 개발(3단계) 착수 직후 안전 중단 → 다음 설계(2단계) 반환(조정자 결정 대기)
- 기준 시각: 2026-08-08T15:32:48Z

### 확정된 사실

- RADIO `docs/execution/radio/P3-T02-radio.md` revision 1, SHA-256
  `fd9bfbb75b97af146c529875bf00a9923ca1cb920de1f1cdb2b1847452b455be`는 index의
  `development_approval`과 일치하고 `gate:radio` 통과 상태다. 봉인 본문은 이번 세션에서 수정하지 않았다.
- RADIO 범위 ④·Architecture 절이 요구하는 "admin 허브 진입 링크 1개"는 `src/app/(protected)/admin/page.tsx`
  (가입 승인·역할 관리·근무자 관리·모집 오픈 4개 링크가 인라인으로 나열된 유일한 허브 파일)를 편집해야 이행할 수
  있는데, 이 파일은 RADIO의 변경 허용 경로 코드펜스(`admin/positions/**`·`admin/schedule/**`·`views/admin/**`
  등) 어디와도 일치하지 않는다. 근거·전례 비교는 `docs/execution/runs/P3-T02/decision-signal.json`에 남겼다.
- 이 gap은 기술 인수 조건 1~8과는 직접 충돌하지 않는다 — 마이그레이션·함수 3종·트리거·포지션 관리 화면·준비 화면
  필요 인원 절·pgTAP·E2E는 모두 RADIO 허용 경로 안에서 계획대로 구현 가능하다. 막힌 부분은 허브 링크 1개뿐이다.
- 유사 전례: P1-T04 revision 2(허용 경로 누락 한 줄을 "사용자 재량 없는 보정"으로 development_approval만
  다시 받아 보정), P2-T05 revision 3("개발 착수 스코프 갭 해소 재봉인, 파일 한정"), P1-T05는 애초
  `src/app/**` 전체를 허용 경로에 포함해 이 문제를 원천적으로 피했다.
- 이번 세션에서 `src/`·`supabase/` 아래 코드·마이그레이션은 한 줄도 작성·스테이징하지 않았다. RADIO·기획
  (`2026-08-09-p3-t02-planning.md`)·설계(`2026-08-09-p3-t02-design.md`) 인터뷰 handoff와 기존 산출물
  (P0-T03 스키마, P1-T05 positions 정책, P3-T01 준비 화면·`get-schedule-prep.ts`, `04-rls-default-deny.test.sql`,
  `17-ceremony-schema.test.sql`)을 읽는 조사만 수행했다.

### 미결 사항

- `src/app/(protected)/admin/page.tsx`를 P3-T02 변경 허용 경로에 추가하는 재봉인(파일 한정)을 승인할지,
  아니면 이번 task 범위에서 허브 링크를 제외하고 후속으로 미룰지 — 결정 주체: 사용자(조정자 경유), 반환 단계:
  설계(development_approval 재승인). 선택지별 트레이드오프는 `decision-signal.json`의 `open_questions`에
  정리했다.

### 다음 행동

1. 조정자가 위 미결 사항을 사용자에게 확인하고, 필요하면 RADIO를 재봉인한다(파일 한정 추가면 revision 2,
   development_approval만).
2. 재승인 후 개발 루프가 P3-T02를 다시 `planned`으로 올리고 이어서 실행한다. 이번 세션은 코드 작업물이 없어
   이어받을 격리 작업물이 없다 — 다음 세션은 이 handoff와 decision-signal만 읽고 처음부터 구현을 시작하면 된다.
   구현 순서 메모(재개 시 참고): ①`supabase/migrations/<ts>_position_requirements.sql`(테이블·RLS·함수 3종
   ·트리거) + `supabase/tests/18-position-requirements.test.sql` ②`src/entities/position/`·
   `src/entities/schedule/api/list-schedule-requirements.ts` ③`src/features/position/`·
   `src/features/requirement/` ④`/admin/positions` 화면과 준비 화면 필요 인원 절 ⑤`tests/e2e/position-requirements.spec.ts`
   ⑥재봉인이 승인되면 admin 허브 링크.

### 증거·산출물 경로

- `docs/execution/runs/P3-T02/decision-signal.json`
- `docs/execution/radio/P3-T02-radio.md` (봉인 본문 무수정 확인)
- `src/app/(protected)/admin/page.tsx`(허브 링크 목록 확인)
- `supabase/migrations/20260807020000_identity_worker_management.sql`(positions 정책·시스템 보호 트리거)
- `src/entities/schedule/api/get-schedule-prep.ts`·`src/app/(protected)/admin/schedule/[id]/page.tsx`
  (P3-T01 준비 화면 산출물 확인)
