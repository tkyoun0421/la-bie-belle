# `.api.ts`는 통신만 들고, service는 도메인 타입을 안 든다

감사의 묶음 둘(`api-exports-only-transport`·`domain-types-leave-services`)을 한 PR로 간다. 둘 다 「그 파일이 제 세그먼트가 말하는 것 말고 무엇을 드나」를 고치고, 동작은 안 바뀐다. 짝 테스트는 함수를 따라 옮긴다.

## 입력 명세·기준

정본은 [ADR-015](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)의 세그먼트 뜻이다 — `api`는 통신과 DTO, `model`은 타입·판정, `utils`는 순수 도구, `lib`은 부작용을 내는 손, `services`는 Query·Mutation. 자리는 [감사](../../proposals/post-refactor-audit.md)의 축 ⑥·⑦이 셌다.

## 옮길 것 — 묻지 말고 이 꼴로 간다

| 지금 | 갈 곳 | 까닭 |
| --- | --- | --- |
| `entities/schedule/api/getMonthSchedule.api.ts`의 `liveAssignmentCount` | `entities/schedule/model/liveAssignmentCount.policy.ts` | 판정이다. `screens` hooks 둘이 당긴다 |
| `entities/rehearsal/api/getMyRehearsals.api.ts`의 `monthRange` | `shared/utils/monthRange.ts`에 같은 일을 하는 것이 있으면 그것으로 합치고, 꼴이 다르면 `entities/rehearsal/utils/rehearsalMonthRange.utils.ts` | 이름이 같은 둘이 다른 일을 하면 안 된다 — 구현자가 두 몸을 대조하고 리턴에 적는다 |
| `entities/member/api/listMembers.api.ts`의 `sortActiveMembers`·`sortLeftMembers` 호출 | 그 함수를 부르는 service가 정렬한다 | repository는 판정을 안 부른다(ADR-015 집행 표의 「`api` → `model` 0」) |
| `shared/utils/devDoor.ts` | `shared/lib/devDoor.lib.ts` | 모듈 변수를 바꾸는 부작용이다. 부르는 자리(`getMyProfile.api.ts`)는 그대로 — 테스트 문은 `__DEV__` 라우트만 연다 |
| `.api.ts` 열다섯의 `*Input`·`*Params`·`CheckInDeps`·`HallLocation` 타입 | 서버로 가는 꼴이면 같은 슬라이스 `.dto.ts`, 도메인 꼴이면 `model/<도메인>.type.ts` | 규칙 37이 `.dto.ts`만 본다 — `.api.ts`는 함수만 낸다 |
| `services` 여섯의 도메인 타입(`WorkMonth`·`AttendanceMonth`·`AttendanceByMonth`·`PayrollByMonth`·`MemberKind`·`NotificationSwitch`) | 같은 슬라이스 `model/<도메인>.type.ts` | `utils`가 `services`를 보는 화살이 사라진다 |
| `shared/hooks/useToast.ts`의 `ToastState` | `shared/model/toast.type.ts` | `model`이 `hooks`를 보는 화살이 사라진다 |
| `features/payrollCompute/services/useMyPayrollViewDaysQuery.ts`가 부르는 `useServerNow` | 시각을 인자 `nowMs`로 받는다. 부르는 controller가 `useServerNow()`를 넘긴다 | `services` → `hooks` 화살이 사라지고 테스트가 시계를 mock할 일이 없어진다 |
| `chartValues.utils.ts` 둘 | 둘의 몸이 다르면 이름을 갈라 각자 하는 일로(`workChartValues`·`attendanceChartValues` 꼴) | 같은 이름이 두 슬라이스에서 다른 일을 한다 |

**새 export마다 규칙 15가 짝을 요구한다.** 함수를 옮길 때 그 함수의 `it`을 새 짝 파일로 옮긴다 — 단언은 그대로다. `monthRange`·`liveAssignmentCount`의 `it`은 지금 integration 파일에 있다(DB 없이 도는 단언이다) — unit 짝으로 내린다.

## 완료 조건

- **AC-01** `.api.ts`가 함수와 `DB` 말고 아무것도 export하지 않는다 — 타입은 `.dto.ts`나 `.type.ts`에 산다
- **AC-02** `api` → `model` 값 import가 `DomainError`·`TransportError`·`memberOf` 말고 0이다
- **AC-03** `services`가 도메인 타입을 export하지 않고 `hooks`를 import하지 않는다
- **AC-04** `model` → `hooks` import가 0이다
- **AC-05** 옮긴 함수의 단언이 하나도 안 바뀌고 초록이다. `pnpm lint`·`pnpm typecheck`·`pnpm test`·옮긴 integration 짝 초록

## 리스크

**새 폴더가 선다** — `entities/rehearsal/utils/`(필요하면), `entities/schedule/model/`은 있다. `scripts/syncEdgeShared.mts`의 `FOLDERS`를 본다 — `entities/notification/model`·`shared/model`이 든다. `MemberKind`·`NotificationSwitch`·`toast.type`이 그 폴더로 가면 `pnpm edge:sync`를 돌리고 Edge 쪽이 무엇을 import하는지 본다.

**`useMyPayrollViewDaysQuery`의 인자가 바뀌면 그 query key에 시각을 넣지 않는다** — 시각이 바뀔 때마다 캐시가 갈린다. 시각은 `select`나 query 밖 계산에서 쓴다.
