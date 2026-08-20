# 2026-08-19 구조 대화 — 세그먼트 재편과 복잡도

- 참여: 사용자 + 조정 세션
- 산출: `P0-T59`(세그먼트 재편과 데이터 접근 deep module)·`P0-T61`(도메인 판정 승격과 화면 model Facade) proposed 등록
- 성격: 기획 인터뷰의 사전 작업. 두 task의 기획 승인 게이트는 아직 열지 않았다 — 승인 요약본과 명시 승인이 남아 있다.

## 확인된 사실 (실측)

- 서버 api 65파일(entities 30·features 35)이 접근 프레임 약 20줄 반복. 표본: `find-own-profile.ts` 46줄, `approve-signup.ts` 34줄.
- supabase 목 체인을 수작업하는 테스트 63파일, `vi.mock` 99파일. 표본: `find-own-profile.test.ts:9-20`.
- 권한 판정 산재: `require-*` 3종(entities/identity/api), `profile-gate`(model), `route-access`(shared/lib).
- 동사 분리 낙오자: entities의 쓰기 `bootstrap-super-admin`·`ensure-schedule-requirements-copied`, features의 읽기 `list-assignment-candidates`·`list-applicants-by-schedule.action`.
- `views/admin-schedule/model/confirmation-warnings.ts`의 인원 미달·교육생 단독 판정은 화면 무관 도메인 규칙.
- `shared/lib`에 써드파티 접점(supabase-*·cn)과 순수 헬퍼(format-*·mask-digits)가 혼재.
- 미실행 봉인 RADIO(P0-T57·T58)는 `src/` 세그먼트 경로를 변경 허용 경로로 물지 않는다 — 세그먼트 개편의 재봉인 연쇄 0.

## 사용자 결정

- features = command/mutation, entities = query/도메인 명사. 레이어 이름은 유지한다.
- 세그먼트: `queries`·`mutations`(역할 이름), `policies`(권한·자격 판정), `utils`(순수 헬퍼), shared는 `lib`(써드파티 접점)/`utils` 분리.
- 테스트 전용 인프라(fake supabase·row factory)는 `shared`가 아니라 `src/` 밖 `tests/helpers`. 판별: 프로덕션이 쓰면 shared, 테스트만 쓰면 tests/.
- 반복 패턴화(runQuery·runAction, 공유 fake)는 규칙 문서가 아니라 구조로 강제한다.

## 기각된 안 (사유)

- actions/use-cases/data-access 3층 분할 — 34줄 mutation을 pass-through 3파일로 가르는 shallow 구조. 업무 규칙 몸통이 DB(RPC)에 있어 나눌 살이 없다.
- `queries`·`mutations` 대신 `actions` 통합 — 이름의 거부력 상실, entities 조회 대부분은 server action이 아니라 이름이 거짓이 된다. 전송수단은 `.action.ts` 접미사가 표시.
- 레이어 개명(entities→queries 류) — 레이어는 의존 지층. entities의 순수 규칙·features의 ui가 이름과 모순.
- `services`·만능 `utils` 세그먼트 — 아무거나 받는 이름은 잡동사니 서랍이 된다.
- 세그먼트 복수형 개명(api→apis) — 미적 이득 대비 계약 계층 비용.
- `shared/testing` 세그먼트 — tests/helpers로 대체(위치가 번들 유입을 차단).

## 미결 (기획 승인 때 정할 것)

- `schemas` 세그먼트 승격 기준 적용 시점 — 클라이언트 폼·서버 액션이 같은 스키마를 공유하는 슬라이스 3+.
- P0-T59의 이행 단위(전 슬라이스 일괄 대 계층별 순차)와 `fsd.json`의 세그먼트별 `verifiedBy` 상세.
- `cancellation-impact`·`candidate-buckets`의 승격 여부 개별 심사(P0-T61).

## 같은 날 함께 진행된 것

- P0-T57 revision 2 재봉인(외부 교차 리뷰 반영, SHA `2c4ec2cf…dcb46`). T58의 T57 SHA 참조 갱신은 승인 대기.
