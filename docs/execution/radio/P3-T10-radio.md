# P3-T10 RADIO 개발 설계

- 상태: Approved
- revision: 3
- 기획 승인: user, 2026-08-16
- 개발 설계 승인: user, 2026-08-16

## 개정 이력

| revision | 날짜 | 내용 |
| --- | --- | --- |
| 1 | 2026-08-16 | 최초 작성. 기획 확정 — 범위는 밴드 계열 전부(recruitment 2 spec 밴드 이전 + 독립 추첨 3 spec 일괄 배분 전환, backlog P3-T06 F-06·P3-T07 F-02·P3-T09 F-03 흡수). 2026-08-16 사용자 결정. |
| 2 | 2026-08-16 | 개발 단계 정지 조건 반환의 해소. revision 1의 인수 조건 4가 「정리 블록 2곳 전체 제거」로 적혀 있었으나, 블록 안에서 무효인 것은 append-only 트리거에 거부되는 schedules delete 한 문장뿐이다 — ceremonies·assignment_positions·assignments·assignment_trainees delete는 테스트 마무리의 사용자 삭제(auth CASCADE)가 FK 위반 없이 지나가기 위한 선행 조건이라 전체 제거 시 두 테스트가 결정적으로 깨진다(implementer 단독 실행 2/2 실패 재현). 인수 조건 4를 「schedules delete 문장만 제거, 나머지 delete 유지」로 수정한다. 2026-08-16 사용자 결정. |
| 3 | 2026-08-16 | 교차 검증 F-01(high)의 해소. revision 2의 인수 조건 3(모듈 레벨 `workDatesInBand` 일괄 추첨)은 fullyParallel에서 같은 파일의 테스트가 다른 워커 프로세스로 갈 수 있고 워커마다 spec 모듈이 재평가되므로 추첨이 공유되지 않는다 — 인용했던 `position-requirements.spec.ts` 관례도 실제로는 한 테스트 안 추첨이라 다른 형태였다. `splitBand` 헬퍼를 추가해 세 spec의 밴드를 테스트별 정적 비겹침 하위 구간으로 분할하고 각 테스트는 자기 구간에서만 추첨하는 방식으로 교체한다. 2026-08-16 사용자 결정. |

- 관련 spec: DOCS:SDD(테스트 전용), 기획 정본은 phase 03 P3-T10 절
- 적용 깊이: 얕음 — 테스트 파일 5개와 e2e 지원 헬퍼 1개만 변경. 제품 코드·DB 스키마·문서 계층 무변경.
- 예정 check IDs: recruitment-e2e-band

## 전제

- 기획 승인(2026-08-16)이 소유한 결정을 다시 열지 않는다: 범위는 다섯 spec + support 헬퍼, 제품 동작 변경 없음.
- `test_mode: verification` — RED→GREEN 의무 없음. 증거는 반복 실행 로그를 `runs/P3-T10/radio.md`에 남긴다.
- 코드 대조로 확인된 사실: 두 recruitment spec 모두 `?month=YYYY-MM` URL로 달을 직접 열므로 원거리 밴드 이전에 달 탐색 장애물이 없다. `recruitment-manage`는 고정 날짜 12·18일+마감 1일, `recruitment-open` 테스트 1은 고정 날짜 10·2·3일을 쓰고 마감은 선택일 중 가장 이른 날짜다. 독립 추첨 3 spec은 각각 `workDateInBand` 2회 호출이다. `post-confirmation-changes`의 정리 블록(105~111·241~245행)의 `schedules` 삭제는 append-only 삭제 거부 트리거에 막히는데 오류를 무시한다.

## Requirements

### 범위와 비목표

범위: `tests/e2e/support/work-date-band.ts`에 전용 밴드 2개와 같은 달 다중 날짜 헬퍼 1개 추가, recruitment 2 spec의 고정 날짜를 전용 밴드로 이전, 독립 추첨 3 spec을 테스트별 정적 비겹침 하위 구간 추첨으로 전환(revision 3), `post-confirmation-changes` 정리 블록의 무효 `schedules` delete 문장 제거(revision 2 — 나머지 delete는 사용자 삭제 CASCADE의 선행 조건이라 유지).

비목표: 제품 코드·DB 스키마·그 외 e2e spec·시나리오와 단언의 의미 변경.

### 불변 규칙

- 다섯 spec의 시나리오·단언은 날짜 산출 방식만 바뀌고 검증 의미는 그대로다. 단언 약화 금지.
- 새 밴드는 기존 밴드와 겹치지 않는다(기존 최댓값 427개월 뒤에서 시작).
- 같은 spec 안의 테스트는 정적으로 갈라진 비겹침 하위 구간에서 추첨해 워커 재평가와 무관하게 서로 겹치지 않는다(revision 3).

### 정지 조건

구현 중 다음을 만나면 우회하지 않고 멈춰 결정 신호로 반환한다.

- 화면이 원거리 월의 표시·선택을 제한해(예: month 쿼리 상한, 달력 범위 제한) 시나리오가 깨지는 경우.
- 날짜 외의 기존 단언을 바꿔야 통과하는 경우.
- 정리 블록 제거가 다른 spec의 실행 결과에 영향을 주는 경우.

### 기술 인수 조건

1. `recruitment-manage.spec.ts`가 전용 밴드 `recruitmentManage`의 같은 달 무작위 날짜 2개(2~27일, 중복 없음)와 그 달 1일 마감으로 동작하고, 기존 단언(연장·재오픈·신청 가능 전환)이 그대로 통과한다.
2. `recruitment-open.spec.ts` 테스트 1이 전용 밴드 `recruitmentBulkOpen`의 같은 달 무작위 날짜 3개(오름차순 분배: 선택 A=최소, 선택 B=중간, 기존 활성=최대, 마감=선택 A 날짜)로 동작하고 기존 단언이 그대로 통과한다.
3. `work-date-band.ts`에 `splitBand(band, parts)` 헬퍼를 추가하고, `schedule-confirmation`·`schedule-roster`·`post-confirmation-changes` 세 spec이 각자 밴드를 하위 구간 2개로 갈라 테스트마다 자기 구간에서만 `workDateInBand`로 추첨한다. 구간이 코드 상수라 fullyParallel 워커가 모듈을 재평가해도 겹칠 수 없다(revision 3 — 모듈 레벨 일괄 추첨은 워커 경계에서 공유되지 않아 폐기).
4. `post-confirmation-changes` 정리 블록 2곳에서 `schedules` delete 문장만 제거된다(append-only 트리거에 거부되는 무효 코드). ceremonies·assignment_positions·assignments·assignment_trainees delete는 테스트 마무리의 사용자 삭제(auth CASCADE)가 FK 위반 없이 지나가기 위한 선행 조건이므로 유지한다(revision 2). 제거 후에도 해당 spec과 전체 e2e가 GREEN이다.
5. `db reset` 없이 다섯 spec을 연속 2회 실행해 두 번 모두 GREEN이다(23505 미재현). 실행 명령·결과를 `runs/P3-T10/radio.md`에 기록한다.
6. `pnpm verify` 전체 GREEN.
7. backlog의 P3-T06 F-06·P3-T07 F-02·P3-T09 F-03 세 줄이 완료 체크된다.

### 위험 기반 테스트

| 인수 조건 | Happy Path | 주요 실패 | 경계값 | 권한 | 중복 요청 | 동시성 |
| --- | --- | --- | --- | --- | --- | --- |
| 1·2 recruitment 밴드 이전 | 테스트함 — 기존 시나리오 단언 그대로 통과 | 테스트함 — 연속 2회 실행에서 자기 충돌 미재현(5번 조건) | 테스트함 — 날짜 2~27일 제한으로 마감 1일과 충돌 없음, 월말 29~31일 미사용 | 해당 없음 — 권한 시나리오(테스트 2)는 날짜 무관 무수정 | 해당 없음 — 날짜 산출 교체만 | 테스트함 — 전용 밴드가 다른 spec과 구간 분리 |
| 3 하위 구간 분할 | 테스트함 — 기존 시나리오 단언 그대로 통과 | 테스트함 — 테스트별 하위 구간이 정적 비겹침이라 상호 충돌 구조적 제거 | 테스트함 — splitBand가 홀수 폭 밴드도 비겹침·전체 포괄로 가른다 | 해당 없음 — 날짜 산출 교체만 | 해당 없음 — 날짜 산출 교체만 | 테스트함 — 구간이 코드 상수라 fullyParallel 워커 재평가와 무관 |
| 4 무효 delete 제거 | 테스트함 — 제거 후 spec 단독·전체 e2e GREEN | 테스트함 — 잔존 schedules 행이 있어도 날짜 격리로 재실행 무충돌(5번 조건이 실증), 유지된 delete로 사용자 삭제 CASCADE 무위반 | 해당 없음 — 한 문장 제거라 경계 없음 | 해당 없음 — 테스트 코드 | 해당 없음 — 테스트 코드 | 해당 없음 — 테스트 코드 |
| 5 반복 실행 | 테스트함 — 본체(연속 2회 GREEN 로그) | 테스트함 — 실패 시 원인 커밋 전 해소가 완료 조건 | 해당 없음 — 통계적 잔여 확률(전 spec 공통 관례 수준)은 수용 | 해당 없음 — 테스트 실행 | 해당 없음 — 테스트 실행 | 해당 없음 — 로컬 단일 DB 실행 |

- 보충 위험: **workDatesInSameMonth 신설 헬퍼** — 같은 달 보장·중복 없음·2~27일·오름차순은 사용 spec의 삽입 성공과 셀 단언 통과가 실증한다(e2e 지원 코드에 단위 테스트를 두지 않는 기존 관례 유지). **원거리 월의 UI 제약**은 코드 대조에서 `?month=` URL 직접 진입으로 확인됐으나, 달력 셀 렌더 규칙이 월 범위를 제한하면 정지 조건이다.

### DEV-* 적용 상태

- DEV-TEST: 기본 적용 — 기존 단언 의미 보존, 시나리오 무변경.
- DEV-TIME: 해당 없음 — 날짜는 밴드 상대 계산이고 화면 시각 표시를 만지지 않는다.
- DEV-SEC·DEV-DATA·DEV-CACHE·DEV-OFFLINE: 해당 없음 — 제품 코드 무변경.

## Architecture

- 테스트 계층만 변경. `src/**`·`supabase/**` 무수정.
- `tests/e2e/support/work-date-band.ts`에 밴드 2개 추가: `recruitmentManage { minMonthsAhead: 429, maxMonthsAhead: 460 }`, `recruitmentBulkOpen { minMonthsAhead: 462, maxMonthsAhead: 493 }` (기존 최댓값 427과 간격 유지, 폭 32개월 관례).
- 같은 달 다중 날짜 헬퍼 `workDatesInSameMonth` 신설 — `monthAnchorInBand`로 달 하나를 뽑고 2~27일에서 중복 없는 날을 뽑아 오름차순 반환. 기존 밴드·헬퍼는 무수정.
- 독립 추첨 3 spec은 `splitBand`로 가른 하위 구간을 테스트별 상수로 갖고 각자 `workDateInBand`로 추첨한다(revision 3).

## Data model

해당 없음 — DB 변경 없음.

## Interface

```ts
export function workDatesInSameMonth(band: WorkDateBand, count: number): string[];
export function splitBand(band: WorkDateBand, parts: number): WorkDateBand[];
```

- `workDatesInSameMonth` 반환: 같은 해·같은 달의 `YYYY-MM-DD` 문자열 `count`개, 일자는 2~27에서 중복 없이, 오름차순. 마감일이 필요한 spec은 그 달의 1일을 쓴다(반환 일자와 충돌 불가).
- `splitBand` 반환: 원 밴드를 순서대로 가른 비겹침 `WorkDateBand` `parts`개 — 구간 합집합이 원 밴드를 포괄하고 인접 구간은 겹치지 않는다.

## Optimizations

해당 없음 — 실행 시간·왕복에 영향 없는 테스트 데이터 산출 변경이다.

## 변경 허용 경로

```
tests/e2e/recruitment-manage.spec.ts
tests/e2e/recruitment-open.spec.ts
tests/e2e/schedule-confirmation.spec.ts
tests/e2e/schedule-roster.spec.ts
tests/e2e/post-confirmation-changes.spec.ts
tests/e2e/support/work-date-band.ts
docs/execution/runs/P3-T10/**
docs/execution/reviews/backlog.md
docs/execution/phases/index.jsonl
docs/execution/radio/P3-T10-radio.md
```

- 용도 한정: spec 5개는 날짜 산출·정리 코드 교체에만 쓴다 — 시나리오·단언의 의미 변경과 약화는 금지다. `work-date-band.ts`는 밴드 2개와 `workDatesInSameMonth`·`splitBand` 추가에만 쓰고 기존 밴드·헬퍼를 바꾸지 않는다(revision 3). `backlog.md`는 F-06(P3-T06)·F-02(P3-T07)·F-03(P3-T09) 세 줄의 완료 체크에만 쓴다. `index.jsonl`은 상태 전환에만 쓴다.

## 미결 사항

- 없음.
