---
status: open
target: unit-test-writer
date: 2026-10-14
resolved:
---

**일**: `system-theme-follows-os`에서 writer가 `themeStorage.lib.test.ts`에 `jest.unstable_mockModule("react-native", …)`로 `Appearance`를 대역으로 두고 「대상이 없어 빨갛다」고 돌려줬다. 구현이 서자 `Appearance.getColorScheme is not a function`으로 죽었다. jest `logic` 프로젝트는 babel에 `platform: "web"`을 넘겨 `babel-plugin-react-native-web`이 구현 쪽 `import { Appearance } from "react-native"`를 `react-native-web/dist/exports/Appearance`로 바꾼다 — 테스트의 `react-native` 대역이 구현의 import에 닿지 않는다. 구현자가 저장소 선례(`openPhone.lib.test.ts`)처럼 실제 모듈을 import해 `Object.assign`으로 함수를 갈아 끼우는 꼴로 준비 코드를 고쳤고, `stores` 폴더는 `react-native` import가 lint로 막혀 `tests/setup/appearance.ts`의 `stubAppearance`를 새로 뒀다.

**고침**: `unit-test-writer` 정의문의 Jest 제약 목록에 한 줄 — `logic` 프로젝트에서 `react-native`는 `unstable_mockModule`로 못 바꾼다, 실제 모듈을 import해 `Object.assign`으로 갈아 끼우거나 값을 인자로 주입한다. 같은 내용을 `docs/4-test/execution.md`에도 둔다. 한 번 본 것이라 세 번째까지 기다리지 않을 만큼 싸다.

**원칙**: 「빨갛다」의 까닭이 「대상 없음」이어도 대역이 실제로 걸리는지는 대상이 서기 전엔 모른다 — 대역이 닿는 경로가 변환기를 거치면 writer가 그 변환을 알아야 한다.
