---
status: closed
target: package.json
date: 2026-10-02
resolved: 2026-10-02
---

# jest 갈래 둘이 ESM 판정 캐시를 나눠 썼다

`shared/lib`을 세그먼트로 가른 뒤 `pnpm test`가 스위트 하나에서 빨개졌다. 테스트는 2004개가 다 통과하는데 스위트가 뜨지 못했다.

```
Must use import to load ES Module: src/shared/utils/cn.ts
  at Object.require (src/shared/ui/Skeleton.tsx:2:1)
```

## 무엇이 겹쳤나

`jest.projects.js`가 갈래 둘을 세운다. `logic`은 `extensionsToTreatAsEsm`에 `.ts`를 넣는다 — 최상위 `await`을 쓰는 테스트가 많아 CJS로는 표현이 안 된다(그 줄을 빼면 스위트 96개가 `await is only valid in ... the top level bodies of modules`로 죽는다). `components`는 그 목록이 비어 있다 — 네이티브 조각과 그 프리셋이 `require`로 올라온다.

`jest-resolve/build/shouldLoadAsEsm.js`의 `cachedShouldLoadAsEsm`이 **경로만을 키로 쓴다.**

```js
let cachedLookup = cachedFileLookups.get(path);
if (cachedLookup === undefined) {
  cachedLookup = shouldLoadAsEsm(path, extensionsToTreatAsEsm);
  cachedFileLookups.set(path, cachedLookup);
}
```

`extensionsToTreatAsEsm`이 키에 안 든다. 한 워커 프로세스가 두 갈래의 스위트를 번갈아 받으면 먼저 본 갈래의 답이 캐시에 앉고 다음 갈래가 그것을 그대로 읽는다. 양쪽이 다 쓰는 `.ts` — `cn`·`reduceMotion`·`dayBand`·`miniCalendar`·`theme`·`noValue` — 전부 그 자리다.

## 왜 이제 보였나

**새 결함이 아니다.** 묶음 5의 PR 본문이 `Skeleton.test.tsx`가 한 번 흔들린 것을 적으면서 까닭을 애니메이션 타이머로 짚었는데, 그것이 이 자리였다. 스위트 실행 순서가 캐시 승자를 정하니 뜨다 말다 한다 — 묶음 6가가 파일을 옮겨 순서가 바뀌면서 매번 뜨는 쪽으로 넘어갔다.

## 고친 것

두 갈래를 각자의 `jest` 프로세스로 돌린다. 캐시가 프로세스 안에 살아서 겹칠 것이 없다.

```
"test": "... sh -c 'jest --selectProjects logic ${1+--passWithNoTests} \"$@\" && jest --selectProjects components ${1+--passWithNoTests} \"$@\"' --"
```

`${1+...}`가 필터를 줬을 때만 꼬리표를 붙인다 — 필터 없이 돌 때 「하나도 안 걸렸다」가 초록이 되면 CI가 빈 실행을 통과시킨다.

## 남는 것

갈래를 하나로 합치는 길은 막혔다. `components`에 `.ts`·`.tsx`를 ESM으로 넣어 보면 `expo-modules-core`가 제 `.ts`를 `require`로 올려 거기서 같은 오류가 난다. jest 쪽이 캐시 키에 그 목록을 넣어 주기를 기다리는 자리고, 그때까지 프로세스 둘이 값이다.
