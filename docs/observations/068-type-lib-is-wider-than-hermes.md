---
status: open
target: tsconfig.json
date: 2026-10-11
---

# `lib: ESNext`가 Hermes에 없는 API를 통과시킨다

`declarative-accumulation`의 자리 분류에서 묶는 루프 넷에 `Map.groupBy`를 쓰자는 제안이 나왔다. 한 줄로 끝나는 선언형 꼴이라 좋은 손인데 **쓸 수 없었다.**

`tsconfig.json`이 `expo/tsconfig.base.json`을 거쳐 `lib: ["DOM", "ESNext"]`를 쓴다. 그래서 `Map.groupBy`(ES2024)가 **타입 검사를 통과한다.** 그런데 이 앱은 Node가 아니라 Hermes로 돈다 — `node_modules/react-native/sdks/.hermesversion`이 `hermes-v0.17.0`이고 `@react-native/js-polyfills`에 그 메서드의 폴리필이 없다.

**없는 메서드는 컴파일이 아니라 실행에서 터진다.** `undefined is not a function`이 그 호출 자리에서 나고, 그 자리가 조건부로만 지나는 곳이면 특정 화면에 들어갈 때까지 안 보인다. `pnpm lint`·`pnpm typecheck`·`pnpm test`가 전부 초록인 채로 나간다 — Jest는 Node에서 돌아 `Map.groupBy`가 있다.

확인할 길도 지금은 막혀 있다. 기기나 시뮬레이터에 올라간 빌드가 없어 `pnpm e2e`를 못 돌린다. 그래서 그 자리들은 `reduce`로 갔다 — 같은 선언형 꼴이고 Hermes에 확실히 있다.

**저장소에 ES2024 API 사용례가 0건이다.** 지금까지 아무도 안 밟았고 이번에 처음 닿았다.

판정이 둘 남았다. **하나** — `lib`을 Hermes가 실제로 드는 수준으로 좁힐지. 좁히면 타입 검사가 그 자리를 막아 주지만 Expo가 주는 기본값을 벗어나고 SDK가 올라갈 때마다 다시 맞춰야 한다. **둘** — 좁히지 않고 검사로 막을지. `tests/lint/`에서 특정 전역·메서드 이름을 금지 목록으로 두는 길인데, 이름만 보면 자기가 정의한 `groupBy`도 걸린다. Hermes가 그 메서드를 들이면 금지 목록이 거짓이 되어 그때 걷어야 한다.
