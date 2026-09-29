---
status: open
target: docs/3-build/plans/notification-push.md
date: 2026-09-29
resolved:
---

# Edge Function이 마운트 밖의 `src/`를 부르는데 아무도 못 잡았다

## 일

`import-holidays`(#464)가 이렇게 쓴다.

```ts
import {
  type HolidayRow,
  parseHolidayApiResponse,
} from "../../../src/features/payroll/model/holiday-api-response.ts";
```

`supabase/functions` 밖이다. `edge-function-import` 스파이크(#396)가 **그 경계를 못 넘는다**고 이미 결론을 냈고 `notification/design.md`가 그 결론을 「CI가 `_shared/`로 복사한다」로 적어뒀다. 저장소에 결론이 있는데 그 결론을 어기는 import가 merge까지 갔다.

막았어야 할 자리가 넷인데 넷 다 지나갔다.

- **plan** — `payroll-holidays` plan이 순수 함수를 `src/`에 두라고만 적고 Edge Function이 어떻게 그것에 닿는지를 안 적었다
- **테스트** — 로컬·CI가 `supabase start -x ... edge-runtime`으로 edge-runtime을 빼고 띄운다. 함수가 부팅조차 안 되니 깨질 것이 없다
- **typecheck** — `tsconfig.json`이 `supabase/functions`를 `exclude`에 둔다. Deno 전역과 `npm:` 지정자가 우리 `tsc`로 안 풀려서다
- **`pr-diff`** — diff에 든 사실만 본다. 「이 경로가 런타임에 안 보인다」는 diff 밖의 지식이다

## 볼 자리

배포는 다를 수 있다. `supabase functions deploy`는 개발자 기계에서 번들을 만들어 올리니 그 순간에는 파일이 보인다 — 그러면 운영은 돌고 로컬만 안 도는 꼴이 된다. 어느 쪽이든 「정본이 금지한 모양이 코드에 섰다」는 그대로다.

## 지은 것

아직 없다. `notification-push` plan의 AC-10이 복사 단계(`scripts/sync-edge-shared.mts`)를 세우면서 `import-holidays`도 그 길로 옮기기로 잡아뒀다.

**검사가 없는 자리가 진짜 발견이다.** 복사 단계가 서도 다음 Edge Function이 또 `../../../src/`를 적으면 똑같이 통과한다. 막는 길은 둘 — lint 규칙(`supabase/functions/`에서 `../../../src/` 시작 import 금지)이거나, CI가 edge-runtime을 켜서 함수가 뜨는지 보는 것이다. 앞쪽이 싸고 뒤쪽이 넓다.

## 원칙

런타임이 안 뜨는 폴더는 어떤 검사도 안 닿는다. 그 폴더의 규칙은 lint가 글자로 보든가, 런타임을 띄워 보든가 둘 중 하나여야 한다.
