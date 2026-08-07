# P1-T07 RADIO 개발 설계

- 상태: Approved
- revision: 1
- 기획 승인: user, 2026-08-07
- 개발 설계 승인: user, 2026-08-07

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-07 | 최초 작성. 설계 인터뷰 확정 3건(단일 파일 구성·pending·rejected 주체 포함·check_ids 의미 정본화 — 2026-08-07) 반영. P1-T02~T06이 확립한 RLS·DEFINER 함수 전체를 주체 축 10종의 전수 매트릭스로 회귀 고정한다. |

- 관련 spec: PRD:AC-12, PRD:AC-13, DOMAIN:IDENTITY, ADR:0002, DOCS:SDD
- 적용 깊이: 일반 (권한 동작 변경 없음 — 기존 승인 동작의 검증 전용 task. 권한 심화 검토는 각 기능 task의 봉인 RADIO가 이미 소유하며, 이 task는 그 결과를 전수 조합으로 고정한다)
- test mode: verification (테스트 자체가 산출물 — RED→GREEN 사이클 없음)
- check IDs: `rls-suite` = 신설 전수 매트릭스 pgTAP(`pnpm db:reset && pnpm db:test`로 실행), `api-authorization-suite` = 기존 Server Action 권한 단위 테스트(vitest)와 E2E 회귀의 대응 확인(신규 스위트를 만들지 않는다 — 기획 확정). 이 정의가 index 기록의 의미 정본이다.

## Requirements

### 범위와 비목표

- 범위: `supabase/tests/11-authorization-matrix.test.sql` 단일 파일 신설. ARCHITECTURE 10장 매트릭스의 P1 행 6종 × 주체 축 10종의 허용·거부 전 조합을 pgTAP으로 단언한다. 그 외 파일은 만들지 않는다.
- 비목표(기획 승인 그대로): P2~P7 행(모집·배정·출퇴근·리허설·완전 삭제 command), 수동 휴면의 활성 신청·배정 조건, 권한 동작 변경, 신규 API 통합 스위트, 신규 E2E. 설계 비목표: 기존 pgTAP(01~10)·vitest·E2E 무수정(픽스처 포함 — 이 task는 파일 하나만 추가한다), 마이그레이션 없음, src/ 코드 없음.

### 불변 규칙

- **케이스의 정본은 ARCHITECTURE 10장 권한 매트릭스다**(PRD 80행 개정 정합화 완료본). 이 RADIO의 Data model 절은 그 P1 행을 조합으로 전개한 파생이며, 두 문서가 어긋나면 ARCHITECTURE가 이긴다.
- 주체 축 10종: anon, pending, rejected, dormant, departed, active 일반 근무자(본인), active 다른 근무자, 팀장 후보(팀장 포지션 보유 active 근무자), admin, super_admin. 팀장 후보는 일반 근무자와 **완전히 동일한** 허용·거부 결과를 가져야 한다(당일 팀장 권한은 확정 배정에서만 파생 — P3 이후).
- 단언은 service role 우회 없이 주체 시뮬(`set local role authenticated/anon` + `request.jwt.claim.sub`)로 실행한다. 픽스처 준비만 superuser로 한다(기존 04~10 관행 그대로).
- 중복 정책(기획 확정): 기존 기능별 테스트(04~10)와의 중복을 허용한다. 이 파일은 회귀 안전망이며 기존 파일의 단언을 옮기거나 지우지 않는다.
- 매트릭스 대응 추적은 pgTAP 단언 메시지 문자열로 한다(행·주체를 문자열에 명시 — 코드 주석 금지 규칙과 정합).
- 거부 단언은 기존 확립된 오류 계약을 그대로 사용한다: 권한 거부 42501, 상태 부적합 LB010/LB011, 시급 범위 LB001, 비활성 포지션 LB002, RLS select 차단은 행 필터링(0 rows)으로 단언.

### 기술 인수 조건

1. 주체 10종 픽스처가 전용 UUID 대역으로 준비되고, 비활성 4종(pending·rejected·dormant·departed)은 `effective_roles() = '{}'`가 직접 단언된다.
2. 매트릭스 P1 행 6종(본인 프로필, 가능 포지션·시급, 다른 사람 개인정보, 관리자 임명, 휴면 해제, 수동 휴면) × 주체 10종의 허용·거부가 전 조합 단언된다 — 허용 조합은 효과(값 변경·행 조회)까지, 거부 조합은 오류 코드 또는 0 rows까지.
3. 팀장 후보의 전 행 결과가 일반 근무자와 동일함이 같은 파일에서 단언된다(별도 절).
4. 모든 단언이 주체 시뮬로 실행되고 service role 주체의 단언이 없다(픽스처 준비 제외).
5. `pnpm db:reset && pnpm db:test`가 신설 파일 포함 GREEN이고, 기존 01~10 파일은 무수정이다.
6. `pnpm verify` 전체 통과(기존 vitest·E2E 회귀 무변경 확인 포함).

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 픽스처·빈 역할 | 테스트함 — 주체 10종 준비와 비활성 4종 빈 역할 단언 | 테스트함 — 픽스처 상태·anchor 조합이 CHECK을 통과함을 setup 자체로 검증 | 테스트함 — 비활성 4종 각각을 개별 단언(묶음 아님) | 해당 없음 — 픽스처 준비는 주체 분기 이전이다 | 해당 없음 — setup은 1회 실행이다 | 해당 없음 — 파일은 단일 트랜잭션에서 돈다 |
| 2 전 조합 매트릭스 | 테스트함 — 허용 조합의 효과(값·행)까지 단언 | 테스트함 — 거부 조합의 오류 코드·0 rows 단언 | 테스트함 — 본인 vs 타인, admin vs super_admin 경계 행 전부 | 테스트함 — 이 표 전체가 권한 단언이다(anon 포함) | 해당 없음 — 상태 부적합 멱등 수렴은 10이 소유한다 | 해당 없음 — 경합 검증은 10의 제약과 함께 backlog 이월이다 |
| 3 팀장 후보 동일성 | 테스트함 — 팀장 포지션 보유자의 전 행 결과 = 일반 근무자 | 테스트함 — 포지션 보유가 admin 판정에 영향 없음(is_admin=false) 단언 | 테스트함 — 팀장 포지션 자체의 조회 허용 범위(본인 읽기)도 동일 | 테스트함 — 2행과 같은 주체 시뮬 | 해당 없음 — 판정은 상태를 만들지 않는다 | 해당 없음 — 요청별 독립 판정이다 |
| 4 주체 시뮬 강제 | 테스트함 — 전 단언이 role 전환 후 실행 | 테스트함 — anon 주체 단언이 함수·조회 양쪽에 존재 | 해당 없음 — 시뮬 방식은 이분법이라 경계값이 없다 | 테스트함 — service role 주체 단언 부재를 구현 리뷰로 확인 | 해당 없음 — 실행 방식 규칙이다 | 해당 없음 — 실행 방식 규칙이다 |
| 5 기존 무수정 | 테스트함 — db:test 전체 GREEN | 테스트함 — 01~10 diff 부재를 커밋 범위로 확인 | 해당 없음 — 파일 추가만 있어 경계가 없다 | 해당 없음 — 5행은 회귀 확인이다 | 해당 없음 — 5행은 회귀 확인이다 | 해당 없음 — 5행은 회귀 확인이다 |
| 6 verify 회귀 | 테스트함 — verify 전체 exit 0 | 테스트함 — 기존 vitest 832·E2E 30 무변경 통과 | 해당 없음 — 위 행들이 세부를 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — 위 행들이 소유한다 | 해당 없음 — E2E는 격리 세션을 쓴다 |

- 보충: 동시 경합·멱등 수렴은 P1-T06의 10-dormancy가 소유한 렌즈라 이 표에 없다. 이 task는 정적 권한 조합의 전수 고정만 담당한다.

### DEV-* 적용 상태

- `DEV-SEC`·AC-12·AC-13: 기본 적용 — 이 task 전체가 그 검증이다. 새 강제 계층은 만들지 않는다.
- `DEV-TEST-01`: 위 렌즈 표. test_mode=verification이라 tdd.json은 해당 없음(gate:tdd 대상 아님 — src/ 코드 무변경).
- `DEV-SSOT-01`: 케이스 정본은 ARCHITECTURE 매트릭스, 이 파일은 투영. 오류 코드는 기존 계약 재사용, 신설 없음.
- `DEV-CODE-07`: 기본 적용 — 추적은 단언 메시지 문자열로, 주석 없음.

## Architecture

- `supabase/tests/11-authorization-matrix.test.sql`(신규, 유일한 산출물): 절 구성 = ① 픽스처(전용 UUID 대역 1개, auth.users + profiles + 역할·포지션 부여, superuser) ② 비활성 4종 빈 역할 ③ 행별 절 6개(각 절에서 주체 10종 순회) ④ 팀장 후보 동일성 절. `plan(N)`은 구현이 확정하고 단언 수와 일치시킨다.
- 검증 대상 함수·정책(기존 정본, 무수정): profiles RLS(본인 select·admin select·insert with-check·update 정책 부재), `own_effective_roles`/`effective_roles`, `approve_signup`·`reject_signup`, `grant_admin_role`·`revoke_admin_role`, `set_hourly_wage`·`update_own_phone`·`update_worker_info`, `grant_position_eligibility`·`revoke_position_eligibility`, `deactivate_worker`·`reactivate_worker`·`reactivate_own_profile`. `bootstrap_super_admin`은 환경 부트스트랩 전용이라 매트릭스 밖이다(07이 소유).

## Data model

스키마 변경 없음. 매트릭스 P1 행의 조합 전개(정본은 ARCHITECTURE 10장):

| 행 | 허용 | 거부(전 나머지 주체) |
| --- | --- | --- |
| 본인 프로필 조회·휴대폰 수정 | 본인(active), admin·super_admin(조회·관리) | anon·비활성 4종(수정), 타인 근무자(조회 0 rows) |
| 가능 포지션·시급 | 본인 읽기·본인 시급 수정, admin·super_admin 관리 | 타인 근무자·anon·비활성 4종 |
| 다른 사람 개인정보 | admin·super_admin 조회 | 일반·팀장 후보·anon·비활성(0 rows) |
| 관리자 임명·해제 | super_admin만 | admin 포함 전 나머지 |
| 휴면 해제 | dormant 본인, admin·super_admin | active 본인(부적합), 타인, anon |
| 수동 휴면 | admin·super_admin(active 대상) | 본인·일반·anon, 비active 대상(부적합) |

## Interface

사용자 인터페이스 변경 없음. 실행 인터페이스는 `pnpm db:reset && pnpm db:test`뿐이다.

## Optimizations

해당 없음 — 런타임 코드 무변경. 테스트 실행 시간 증가는 단일 파일·단일 트랜잭션 범위로 제한된다.

## 변경 허용 경로

```
supabase/tests/**
docs/execution/radio/P1-T07-radio.md
docs/execution/runs/P1-T07/**
docs/execution/phases/index.jsonl
```

## 미결 사항

- 없음. 병렬 커넥션 동시성 인프라와 medium·low backlog 정비는 이 task 밖의 별도 주기다.
