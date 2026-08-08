# P2-T05 RADIO 개발 설계

- 상태: Approved
- revision: 3
- 기획 승인: user, 2026-08-07
- 개발 설계 승인: user, 2026-08-08

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-08 | 최초 작성. 설계 인터뷰 확정 6건(관리자 진입은 T04 시트 확장·신청 수는 달력 셀 배지+시트·임박 기준은 오늘 포함 3일·카드는 신청 무관+상태 표시·오늘/임박 판정은 KST 서버 계산·조회는 기존 RLS 재사용)을 반영. 봉인된 P2-T03(신청 batch·일정 탭)·P2-T04(관리 시트·자동 마감) RADIO를 계약으로 삼아 두 task 구현 완료 전에 설계했다(파이프라이닝). 선행 재봉인이 생기면 시트·달력 전제를 재점검한다. |
| 2 | 2026-08-08 | KST 판정 근거 정정 — DEV-TIME-03·04가 이미 MUST 규칙으로 존재하므로 "후보 규칙 승격 별도 제안" 표현을 "기본 적용"으로 바로잡고 해당 미결 항목을 제거. 결정 내용 변경 없음. |
| 3 | 2026-08-08 | 개발 착수 스코프 갭 해소 재봉인(user 승인 — 파일 한정). 기술 인수 조건 1의 달력 셀 배지는 셀을 전담 렌더하는 `src/shared/ui/calendar.tsx`의 확장 없이는 구현 불가(`docs/execution/runs/P2-T05/decision-signal.json`)라 변경 허용 경로에 그 한 파일만 추가하고, Calendar 최소 확장(dateStates 항목의 선택적 신청 수 필드, 값이 있을 때만 숫자 배지 렌더)을 Architecture에 명시. 그 외 결정 내용 변경 없음. |

- 관련 spec: PRD:AC-01, PRD:AC-02, DOMAIN:SCHEDULING, DESIGN:WORKER-FLOWS 앱 셸과 홈 절
- 적용 깊이: 심화 (관리자 개인정보 조회·시간 경계·홈 우선순위 정합)
- test mode: verification
- 예정 check IDs: verify(pnpm verify 전체 — 단위·pgTAP 포함), recruitment-e2e(모집 생성→다중 신청→마감→구분 확인의 모바일 E2E — Playwright). 기획 시점 등록 그대로 유지, 의미만 정본화.

## Requirements

### 범위와 비목표

- 범위: ① 관리자 모집 달력 셀에 날짜별 신청 수 배지, T04 관리 시트에 신청 현황 섹션(신청 수 + applied 신청자 이름 목록) 추가 ② 홈 「마감 임박 근무 신청」 카드를 실데이터로 전환 — KST 오늘 포함 3일(D+0~D+2) 내 마감 예정 OPEN 모집 중 가장 임박한 1건, 본인 신청 상태에 따라 신청 유도 또는 「마감 전까지 변경 가능」 안내 ③ 워커 마감(CLOSED) 날짜 상세의 P2 버전(날짜·마감 상태·내 신청 상태·확정 대기 안내) ④ 상태 전이·시간대 경계·다중 신청의 unit·pgTAP·E2E 테스트와 F-03(월 경계 시간대) 회귀 고정.
- 비목표(기획 승인 그대로): 포지션 배정·확정 화면(P3 — 확정 상세 스텁은 이 task에서 내용을 바꾸지 않는다), 모집 오픈·마감 푸시(P4), 철회 이력 화면. 설계 비목표: 새 마이그레이션·스키마·RLS 변경 없음(조회 전용 task), P2-T01~T04 산출물의 봉인 계약 무수정(T04 시트는 하위 호환 확장만), 기존 pgTAP 01~15 무수정.

### 불변 규칙

- **개인정보 최소화를 DTO가 강제한다**: 관리자 신청자 목록 DTO는 이름 문자열만 담는다. 전화번호·성별·시급·가능 포지션은 타입에 존재하지 않는다(2026-08-07 기획). 목록은 applied만 담고 철회자는 조회 자체에서 제외한다.
- **임박·오늘 판정은 서버가 KST로 계산한다** — `DEV-TIME-03`(달력·마감·월 경계는 Asia/Seoul)·`DEV-TIME-04`(클라이언트 시각 비정본)의 기본 적용이며, 2026-08-08 설계 인터뷰가 이 적용을 확인했다. 브라우저 시간대는 표시에만 관여하고 판정에 관여하지 않는다. T03의 「KST 오늘」 prop·마감 이중 검증(`(now() at time zone 'Asia/Seoul')::date`) 관례를 재사용한다.
- **카드 선정 규칙은 model 한 곳이 소유한다**: 후보 필터(OPEN·마감일 D+0~D+2)·최임박 선택·신청 상태 문구 분기는 `views/home/model`의 순수 함수다. ui에는 로직을 두지 않는다.
- **홈 우선순위 선택기(`deriveHomePriority`)의 기존 순서를 바꾸지 않는다**: `deadline-application` 슬롯의 입력만 실데이터로 채운다. 출근(1순위) 데이터는 P5 전까지 null 입력 그대로다.
- 시트 신청자 이름 조회는 시트를 연 시점에만 수행한다 — 월 전체 이름 선로딩으로 PII 전송을 넓히지 않는다. 조회 권한은 기존 RLS(`applications_select_own_or_admin`, `profiles_select_admin`)가 강제하고 서버 경계는 관리자 세션을 확인한다.
- ui 세그먼트는 api를 import하지 않는다 — 조회 Server Action·데이터는 page가 주입한다(T03·T04 관례).

### 기술 인수 조건

1. 관리자 모집 달력: 모집이 있는 날짜 셀에 applied 신청 수 배지가 표시되고, 월 이동 시 해당 월 범위로 갱신된다. 집계는 서버 조회 1회(월 범위 group by)다 — unit(집계 매핑)·E2E(표시).
2. 관리 시트: 활성·마감 모집 날짜의 시트에 신청 수와 applied 신청자 이름 목록이 표시된다. 이름 외 필드는 DTO에 없다 — unit(DTO)·E2E(표시). 철회자가 목록·수에 포함되지 않는다 — pgTAP 픽스처 기반 unit.
3. 홈 카드: KST 오늘 기준 마감일이 D+0~D+2인 OPEN 모집 중 가장 임박한 1건을 선정한다. 미신청이면 신청 유도 문구와 일정 탭 이동, applied면 「마감 전까지 변경 가능」 안내를 보여준다. 해당 모집이 없으면 기존 우선순위대로 다음 슬롯이 렌더된다 — model unit(D+2/D+3 경계·빈 후보·동률 시 마감일 빠른 순)·E2E(카드 노출).
4. 워커 CLOSED 날짜 상세: 날짜·마감 상태·내 신청 상태(applied/미신청)와 확정 대기 안내를 보여주고, 배정표·개인정보는 렌더하지 않는다. 확정 상세 스텁 경로는 무수정이다 — component 검증·E2E.
5. 시간대 회귀: 브라우저 시간대를 KST가 아닌 값(예: America/Los_Angeles)으로 고정한 E2E에서 달력 월 경계·마감 표시·카드 노출이 KST 기준과 동일하다. F-03 월 경계 결함이 unit으로도 고정된다.
6. E2E(recruitment-e2e): 관리자 모집 생성 → 셀 배지 0 확인 → 근무자 다중 신청 → 배지·시트 이름 반영 확인 → 마감 픽스처 전환 → 근무자 달력 구분·CLOSED 상세·홈 카드 소멸 확인.
7. `pnpm verify`와 `pnpm db:reset && pnpm db:test` 전체 통과. 기존 홈 스텁 테스트(`home-priority.test.ts`·`HomeView.test.tsx`)는 `deadline-application` 입력 확장에 맞춰 갱신한다 — 기존 테스트 무수정 원칙의 명시적 예외이며, 우선순위 순서 단언은 보존한다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 배지 집계 | 테스트함 — 월 범위 신청 수 매핑 | 테스트함 — 조회 실패 시 배지 없이 달력 유지 | 테스트함 — 신청 0건·월 경계 날짜 포함 | 테스트함 — 관리자 아님 조회 거부 | 해당 없음 — 읽기 전용 | 해당 없음 — 표시 시점 스냅샷이다 |
| 2 시트 신청 현황 | 테스트함 — 신청 수·이름 목록 표시 | 테스트함 — 조회 실패 시 시트 관리 기능 유지 | 테스트함 — 철회자 제외·0명·동명이인 | 테스트함 — RLS·서버 경계 이중 확인 | 테스트함 — 시트 재오픈 시 재조회 수렴 | 해당 없음 — 읽기 전용 |
| 3 홈 카드 선정 | 테스트함 — 최임박 1건·상태별 문구 | 테스트함 — 조회 실패 시 빈 슬롯 진행 | 테스트함 — D+2 포함·D+3 제외·후보 없음·동률 | 해당 없음 — 본인 신청만 읽는다(RLS) | 해당 없음 — 파생 표시다 | 해당 없음 — 서버 렌더 스냅샷이다 |
| 4 CLOSED 상세 | 테스트함 — 상태·내 신청 표시 | 테스트함 — 미존재 스케줄 안전 처리 | 테스트함 — applied·미신청·철회 후 상태 | 테스트함 — 타인 신청 비노출(RLS) | 해당 없음 — 읽기 전용 | 해당 없음 — 읽기 전용 |
| 5 시간대 회귀 | 테스트함 — KST 판정과 표시 일치 | 테스트함 — F-03 월 경계 재현 케이스 GREEN | 테스트함 — KST 자정 직전·직후, 비KST 브라우저 | 해당 없음 — 판정은 서버 소유다 | 해당 없음 — 판정 함수는 순수다 | 해당 없음 — 판정 함수는 순수다 |
| 6 E2E 왕복 | 테스트함 — 생성→신청→마감→구분 전 구간 | 테스트함 — 마감 후 카드 소멸·신청 불가 | 테스트함 — 다중 신청 반영·배지 갱신 | 테스트함 — 관리자·근무자 세션 분리 | 해당 없음 — 세부는 1~4행 소유 | 해당 없음 — 단일 세션 시나리오다 |
| 7 회귀 | 테스트함 — verify·db:test 전체 GREEN | 테스트함 — 선행 산출물 무수정을 커밋 범위로 확인 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 |

- 보충 위험: P2-T03·T04가 구현 중이라 시트·달력 실물이 아직 없다. 선행 구현이 봉인과 다르게 재봉인되면 이 RADIO의 시트 확장·셀 배지 전제를 재점검한다(파이프라이닝 안전선).

### DEV-* 적용 상태

- `DEV-SEC`(개인정보 최소화): 이름 전용 DTO·시트 오픈 시점 조회·RLS 재사용(추가 결정 — 위 불변 규칙).
- `DEV-SSOT-01`: 카드 선정·임박 경계 상수는 `views/home/model` 한 곳, 임박 일수 상수는 `shared/config`가 소유한다(기본 적용).
- `DEV-TIME-03`·`DEV-TIME-04`: 달력·마감·경계의 KST 계산과 클라이언트 시각 비정본(기본 적용 — 위 불변 규칙이 적용을 확인).
- `DEV-TIME-05`: 카드 선정·경계 로직은 KST 오늘을 주입받는 순수 함수로 두고 자정·월 경계·D+2/D+3 경계값 테스트를 제공한다(기본 적용).
- `DEV-TEST-01`: verification 모드 — 위 위험 표의 검증 증거를 runs에 남긴다(기본 적용).
- `DEV-CODE-07`: 설명 주석 금지(기본 적용).

## Architecture

- `src/entities/schedule/api/`: `count-applications-by-month.ts`(관리자 — 월 범위 schedule_id별 applied 수), `list-applicants-by-schedule.ts`(관리자 — applied 이름 목록, profiles join), `find-imminent-recruitment.ts`(근무자 — KST 오늘 D+0~D+2 OPEN 최임박 1건 + 본인 신청 상태, T03 `list-own-applications` 재사용). 모두 `server-only`, 세션 클라이언트 사용, 새 DB 함수 없음. `applications`의 `unique(schedule_id, profile_id)`가 schedule_id 선행 인덱스로 집계를 커버한다 — T03이 이월한 인덱스 재검토의 결론(추가 인덱스 없음).
- `src/entities/schedule/model/`: 신청자 이름 DTO·집계 DTO(이름 외 필드 없는 타입).
- `src/features/recruitment/`: `api/list-applicants-by-schedule.action.ts`(시트 오픈 시 호출하는 조회 Server Action — requireAdmin→Zod(uuid)→조회→typed Result), `ui/RecruitmentManageSheet` 신청 현황 섹션 추가(T04 시트 하위 호환 확장 — 기존 폼·Action 무수정).
- `src/shared/ui/calendar.tsx`: `dateStates` 항목에 선택적 신청 수 필드를 추가하고 `CalendarDayButton`이 값이 있을 때만 작은 숫자 배지를 그리는 최소 확장. 기존 `CalendarCellState` 7종 유니온·`STATE_BADGE` 문자열·공개 prop(month·onMonthChange·dateStates·onSelectDate·today)과 기존 소비처는 무수정이며, 필드를 주지 않는 호출은 렌더 결과가 그대로다(하위 호환).
- `src/views/admin-recruitment/`: 셀 배지 렌더 분기(model 소유)·시트에 조회 Action 주입.
- `src/views/home/`: `model/home-priority.ts`의 `deadline-application` variant에 본인 신청 상태 필드 추가, `model/imminent-recruitment.ts`(경계·선정·문구 분기 순수 함수 — `shared/config`의 임박 일수 상수 사용), `ui/HomeView` 카드 실데이터 렌더(일정 탭 이동 링크). `home.mock.ts`는 preview가 계속 쓰면 잔존 허용.
- `src/views/schedule-detail/`: CLOSED variant 추가(확정 variant 무수정), 분기는 model 소유.
- `src/app/(protected)/(tabs)/page.tsx`: 서버 컴포넌트에서 `find-imminent-recruitment` 조회 후 `deriveHomePriority` 입력 주입.
- `src/app/(protected)/admin/recruitment/page.tsx`: 월 집계 조회 추가·시트 조회 Action 주입.
- `src/app/(protected)/schedule/[id]/page.tsx`: CLOSED 상태 데이터 조회·분기 주입.
- `tests/e2e/recruitment-flow.spec.ts`(신규): 인수 조건 6. 비KST 시간대 케이스는 Playwright `timezoneId`로 고정한다. 마감 전환 픽스처는 pgTAP 14·15번의 UPDATE 기법을 seed 헬퍼로 재사용한다.

서버·클라이언트 경계: 조회는 서버 컴포넌트와 조회 Server Action에만 있고, 클라이언트는 주입된 데이터·Action만 사용한다.

## Data model

- 정본: `schedules`·`applications`·`profiles` 기존 스키마 그대로. 새 테이블·마이그레이션·RLS 변경 없음.
- 관리자 조회는 기존 `applications_select_own_or_admin`·`profiles_select_admin` RLS를 통과하는 select다. 근무자 조회는 본인 행만 반환하는 기존 정책 그대로다.
- KST 오늘·D+2 경계는 서버 유틸(T03 KST 관례 재사용)이 계산해 date 문자열로 비교한다. 초 단위 경계는 만들지 않는다(T03 date 비교 관례).
- 파생 표시(배지·카드)는 요청 시점 스냅샷이며 클라이언트 캐시를 두지 않는다. T04의 연장·재오픈 후 `revalidatePath` 관례가 배지·시트를 함께 갱신한다.

## Interface

- 관리자 모집 달력(`/admin/recruitment`): 모집 날짜 셀에 신청 수 배지. 날짜 탭 → T04 관리 시트(기존 상태·마감 관리) + 신청 현황 섹션(수·이름 목록, 로딩·실패 시 관리 기능은 유지하고 목록만 재시도 안내).
- 홈(`/`): 출근 슬롯이 비어 있을 때 임박 모집이 있으면 「마감 임박 근무 신청」 카드 — 날짜·마감일·(미신청) 신청 유도 / (applied) 「신청 완료 — 마감 전까지 변경 가능」, 탭 시 일정 탭 이동. 임박 없음이면 다음 우선순위 렌더.
- 워커 날짜 상세(`/schedule/[id]`): CLOSED면 날짜·「모집 마감」·내 신청 상태·확정 대기 안내. 확정 variant는 기존 스텁 유지.
- 조회 Server Action Result: 성공 `{ok:true, applicants:[{name}]}` / 실패 typed code(42501→`IDENTITY_NOT_ACTIVE` 관례 매핑, 그 외→`COMMON_UNEXPECTED`).
- 실행: `pnpm verify`, `pnpm db:reset && pnpm db:test`, `pnpm test:e2e`.

## Optimizations

- 조회는 월 집계 1회 + 시트 오픈 시 이름 1회 + 홈 1회로 고정한다. N+1·클라이언트 폴링 없음.
- 새 dependency·새 DB 객체 없음. 되돌림은 화면·조회 모듈 제거로 충분하다.
- 성능 인덱스는 기존 유니크 인덱스가 커버하므로 추가하지 않는다. 관측은 기존 구조화 stderr 로그 관례를 따른다.

## 변경 허용 경로

```
src/app/(protected)/(tabs)/page.tsx
src/app/(protected)/admin/recruitment/**
src/app/(protected)/schedule/[id]/**
src/entities/schedule/**
src/features/recruitment/**
src/views/admin-recruitment/**
src/views/home/**
src/views/schedule-detail/**
src/shared/config/**
src/shared/ui/calendar.tsx
supabase/tests/**
tests/e2e/**
docs/execution/radio/P2-T05-radio.md
docs/execution/runs/P2-T05/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- P2-T03·T04 구현이 재봉인을 일으키면 시트 확장·셀 배지·달력 전제를 재점검한다(파이프라이닝 안전선). 결정 주체: 조정자(재봉인 발생 시).
