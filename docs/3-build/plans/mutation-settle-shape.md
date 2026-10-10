# 쓰기가 끝났다고 말하는 시점을 한 꼴로

mutation 42자리가 같은 뒤처리를 세 꼴로 부르고, 그 선택이 **시트가 언제 닫히나**를 가른다. 기다리는 쪽으로 모은다.

## 입력 명세·기준

**결정은 [triage 제안](../../proposals/codebase-refactor-triage.md)의 묶음 B다** — 「`isSuccess`는 새 데이터가 온 뒤에 선다」.

**저장소에서 확인한 것.**

mutation service 45개 가운데 43개가 `onSuccess`에서 `queryClient.invalidateQueries`를 부른다. 안 부르는 둘은 까닭이 있다 — `features/auth/services/useSignOutMutation.ts`는 `queryClient.clear()`로 캐시를 통째로 버리고(로그아웃이라 낡게 할 것이 아니라 지울 것이다), `useRetryEntryMutation.ts`는 무를 것이 없다. 그 둘은 범위 밖이다.

**꼴이 셋으로 보이지만 실은 둘이다.**

| 꼴 | 수 | 무는 키 | 프로미스를 돌려주나 |
| --- | --- | --- | --- |
| `return queryClient.invalidateQueries({ queryKey })` | 15 | 하나 | 돌려준다 |
| `onSuccess: async () => { await queryClient.invalidateQueries({ queryKey }) }` | 6 | 하나 | 돌려준다 |
| `for (const queryKey of staleTogether.X) { void queryClient.invalidateQueries({ queryKey }) }` | **20** | 여럿 | **안 돌려준다** |
| `void queryClient.invalidateQueries({ queryKey })` (루프 없이) | 1 | 하나 | 안 돌려준다 |

**갈림의 축은 「무는 키가 하나냐 여럿이냐」다.** 키 하나인 21자리는 전부 기다리고, 루프를 도는 20자리는 전부 안 기다린다. 꼴이 셋으로 자란 것은 기준이 없어서가 아니라 **루프를 기다리는 법을 아무도 안 써서**다. 예외 하나는 `features/qualificationGrant/services/useGrantPositionMutation.ts` — 키가 하나인데 `void`다.

루프가 도는 목록은 `src/shared/api/queryKeys.ts:65`의 `staleTogether` 둘뿐이다.

| 목록 | 키 | 쓰는 자리 |
| --- | --- | --- |
| `scheduleWrite` | `schedule.all` · `payroll.all` · `request.all` | **17** |
| `rehearsalWrite` | `rehearsal.all` · `payroll.all` | **3** |

근무·리허설 쓰기만 급여와 요청으로 번지고, 한 도메인에 갇힌 쓰기(회원·프로필·시급·QR·공휴일·조정)는 키 하나로 끝난다. **그 갈림은 까닭이 있어 남긴다** — 고치는 것은 번지는 쓰기를 「안 기다린다」는 쪽이다.

**`isSuccess`가 늦게 서면 무엇이 달라지나.** 조각 controller 열여섯이 그 값을 읽어 시트를 닫는다 — `features/*/hooks/`의 `useHallDefaultsSheet`·`useMemberDetailSheet`·`useMemberSheet`·`useContactSheet`·`usePhotoSheet`·`usePendingEditor`·`useRehearsalFormSheet`·`useConfirmSheet`·`useCloseDayWarningSheet`·`useCreateScheduleSheet`·`useDayHoursSheet`·`useDefaultWageSheet`·`useMemberWageSheet`·`useApprovalDetailSheet`·`useCancelShiftSheet`·`useRequestSheet`다. 꼴은 `useEffect(() => { if (isSuccess) onDone() })`나 `onSaved()`고, 화면 controller 일곱이 또 그 `onDone`을 받아 시트 상태를 지운다.

`setQueryData`는 저장소에 한 자리도 없다. `refetch`는 전부 사용자가 누르는 「다시」고 성공 뒤처리가 아니다. 그 둘은 이 계획이 건드리지 않는다.

## 왜 고치나

같은 동작이 슬라이스마다 다르다. 시급을 바꾸면 시트가 새 값이 온 뒤 닫히고, 자리를 더하면 요청만 날린 채 바로 닫힌다. 뒤쪽은 다시 열었을 때 낡은 값이 한 틱 보일 수 있고, 그것이 설계 결정이 아니라 **루프를 어떻게 기다리는지 아무도 안 적어서 생긴 차이**다.

기다리는 쪽을 고른 값은 시트 닫힘이 한 틱 늦는 것이고, 치르는 까닭은 낡은 값이 보이는 자리를 없애는 것이다.

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| 루프를 도는 mutation 20개 | `onSuccess`가 `Promise.all`로 목록을 함께 기다리고 그 프로미스를 돌려준다 |
| `features/qualificationGrant/services/useGrantPositionMutation.ts` | 키 하나 꼴로 — `return`한다 |
| `await`를 쓰는 6개 | `async`를 벗고 `return` 한 꼴로 모은다 — 키가 하나라 기다릴 것이 하나다 |
| `eslint-rules/mutationSettleShape.mjs` | 신설 — `onSuccess` 안의 `void queryClient.invalidateQueries`를 막는다 |
| `eslint-rules/index.mjs` · `eslint.config.mjs` · `tests/lint/rules.ts` · `docs/4-test/execution.md` | 규칙 하나를 켜는 다섯 자리의 나머지 넷. `DOCUMENTED_LINT_RULE_COUNT`가 하나 늘고 `ruleCatalogue.test.ts`가 살아 있는 설정을 읽어서다 |
| 조각 controller 16개의 짝 테스트 | 시트가 **새 데이터 뒤에** 닫히는 것을 단언하는 자리가 선다. 기존 단언은 안 고친다 |

## 완료 조건

- **AC-01** `void queryClient.invalidateQueries`가 `src/` 비(非)테스트 파일에 0이다. query service의 `refetch`(`features/payrollCompute/services/useMyPayrollViewDaysQuery.ts`)는 `onSuccess`가 아니라 사용자가 누르는 「다시」라 이 셈 밖이다 — 그 자리를 남길지는 구현이 보고하고 판정은 총괄이 한다
- **AC-02** 루프를 도는 20자리가 `Promise.all`로 목록을 함께 기다리고 `onSuccess`가 그 프로미스를 돌려준다. 하나씩 순서대로 기다리지 않는다 — 세 키를 무르는 일에 순서가 없다
- **AC-03** 키 하나인 22자리가 `return queryClient.invalidateQueries({ queryKey })` 한 꼴이다. `async`/`await`를 쓰지 않는다 — 기다릴 것이 하나면 돌려주는 것으로 끝난다
- **AC-04** 조각 16개의 기존 테스트가 깨지지 않는다. 그중 하나(루프를 도는 mutation을 쓰는 자리)에 **시트가 새 데이터 뒤에 닫히는 것**을 단언하는 테스트가 본보기로 선다
- **AC-05** `eslint-rules/mutationSettleShape.mjs`가 `onSuccess` 안의 `void queryClient.invalidateQueries`를 막고, 그 규칙이 다섯 자리에 한 커밋으로 선다
- **AC-06** `pnpm lint`·`pnpm typecheck`·`pnpm test`가 초록이다

## 작업 순서

1. 실패 테스트를 쓴다 — AC-04의 본보기 하나다. **mock이 `invalidateQueries`를 어떻게 흉내 내는지가 갈림이다** — 즉시 resolve하는 `jest.fn()`이면 `await`로 바꿔도 단언이 안 깨지고, 그러면 그 테스트가 지키는 것이 없다. 지연을 넣어 순서를 재는 꼴이 필요한지 `test-planner`가 판정한다
2. 루프 20자리를 `Promise.all`로 바꾼다
3. 키 하나 22자리를 `return` 한 꼴로 모은다
4. 조각 16개의 테스트를 돌려 깨지는 자리를 본다. 깨지면 그것이 `isSuccess` 시점에 매달린 자리고, **단언을 고치기 전에 보고한다** — 그 자리가 늦은 성공을 못 받는 까닭이 있으면 설계 결정이다
5. lint 규칙을 다섯 자리에 한 커밋으로 켠다. **자리를 다 옮긴 뒤여야 초록이 난다**
6. 검증하고 PR을 연다

## 리스크

**`isSuccess`가 늦게 서면 `reset()`과의 순서가 바뀔 수 있다.** 조각 셋(`useMemberSheet`·`useRehearsalFormSheet`·`usePendingEditor`)이 `reset`을 받아 쓴다. 성공을 보고 `onDone`을 부른 뒤 `reset`을 부르는 꼴이면 영향이 없지만, 그 사이에 다른 상태를 읽는 자리가 있으면 순서가 보인다. 2번 걸음 전에 그 셋을 읽는다.

**낙관적 갱신이 없어 되돌릴 것이 없다.** `onMutate`를 쓰는 mutation이 저장소에 0이고 `setQueryData`도 0이라, 기다리는 동안 화면이 낡은 값을 그대로 든다. 그 사이에 사용자가 같은 버튼을 또 누르는 자리는 `sending` 플래그가 막는다 — 조각 17개가 그 플래그를 낸다.

## 검증

`pnpm lint` · `pnpm typecheck` · `pnpm test`. 테스트를 좁혀 돌릴 때는 `pnpm exec jest <경로>`를 쓴다. integration은 범위 밖이다 — `api/`를 안 건드리고 `services/`의 뒤처리만 바꾼다.
