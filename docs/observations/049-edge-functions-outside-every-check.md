---
status: open
target: supabase/functions/
date: 2026-10-02
resolved:
---

# 이름 규칙을 바꾼 묶음이 Edge Function import를 깨뜨리고 다섯 묶음을 지나갔다

묶음 7에서 `scripts/syncEdgeShared.mts`의 복사 경로를 고치려고 열어 보니, Edge Function 둘이 **없는 파일을 import하고 있었다.**

```
supabase/functions/send-push/index.ts:18      ../_shared/notification/push-message.ts
supabase/functions/send-push/index.ts:23      ../_shared/notification/push-result.ts
supabase/functions/import-holidays/index.ts:18  ../_shared/payroll/holiday-api-response.ts
```

복사본에 실제로 있는 것은 `pushMessage.ts`·`pushResult.ts`·`holidayApiResponse.ts`다. **묶음 1(AC-01)이 `src/`의 이름을 camel로 바꿀 때 복사본 이름도 따라 바뀌었는데 부르는 쪽이 안 바뀌었다.** 그 뒤로 묶음 다섯이 지나가는 동안 아무것도 안 울었다.

## 왜 아무것도 안 울었나

`supabase/functions/`가 검사 셋 전부의 밖이다.

| 검사 | 왜 못 보나 |
| --- | --- |
| `pnpm typecheck` | `tsconfig.json`의 `exclude`에 `supabase/functions`가 들어 있다 |
| `pnpm test:integration` | CI가 `supabase start -x ...,edge-runtime`으로 띄워 함수를 아예 안 돌린다 |
| `pnpm lint` | `house/no-node-import-in-edge-shared`는 `src/` 쪽만 보고 `supabase/functions/`의 지정자는 안 본다 |
| `tests/lint/fileNaming.ts` | 범위가 `src`·`tests`·`scripts`·`eslint-rules`다 |

`_shared`는 생성물이고 `.gitignore` 안이라 diff에도 안 뜬다. 깨진 것을 볼 수 있는 자리는 **배포뿐이다.**

## 두 번째 구멍

`eslint-rules/noNodeImportInEdgeShared.mjs`의 `COPIED_TO_DENO`가 알림 폴더 하나만 들고 있었다. 공휴일 응답 파서도 Deno로 복사되는데 그 목록에 없어, 거기 Node API를 넣어도 lint가 안 울었다. 규칙 머리글이 「복사 대상이 늘면 이 목록과 `scripts/syncEdgeShared.mts`가 같이 는다」고 적어 뒀는데 한쪽만 늘었다.

## 이 묶음이 한 것

세 import를 복사본의 실제 이름으로 고치고, 복사 경로를 새 슬라이스에 맞췄다(`entities/notification/model` → `notification`, `features/holiday/model` → `holiday`). `COPIED_TO_DENO`에 공휴일 폴더를 더했다.

## 볼 자리

**지정자가 복사본에 실제로 있는지 보는 검사가 없다.** `syncEdgeShared.mts`는 복사하는 쪽만 보고 부르는 쪽을 안 본다 — 복사가 끝난 뒤 `supabase/functions/*/index.ts`의 `../_shared/...` 지정자를 하나씩 열어 파일이 있는지 보면 된다. 스크립트가 이미 그 자리에 서 있고 두 목록을 다 들고 있어, 던지는 줄 하나면 다음 이름 변경이 조용히 지나가지 않는다.

같은 축으로 `COPIED_TO_DENO`와 `FOLDERS`가 손으로 맞춰야 하는 두 목록이다. 하나를 다른 하나에서 읽게 하면 어긋날 자리가 사라진다.

## 원칙

**검사 밖에 둔 폴더는 이름 규칙 밖에도 있다.** `src/app/`은 「Expo Router가 URL로 읽는다」는 까닭이 있어 밖이고 그 까닭이 문서에 적혀 있다. `supabase/functions/`는 까닭이 적힌 적 없이 세 검사에서 각각 다른 이유로 빠져, 밖이라는 것을 아무도 결정하지 않았는데 밖이 됐다.
