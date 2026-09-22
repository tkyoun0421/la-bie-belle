# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**세션·딥링크·진입 판정을 구현한다.** [`expo-scaffold`](backlog.md)(`active`)의 AC-07·08·09다. 설계 공백은 이번 회차에 닫았다 — 세션을 어디에 남기는지는 [runtime.md의 「세션」](2-design/system/runtime.md#세션)이, 딥링크 흐름은 [account/design.md의 「첫 진입과 게이트」](2-design/modules/account/design.md#첫-진입과-게이트)가 소유한다. 새 의존성 둘이 필요하다 — `aes-js`와 `react-native-get-random-values`. 다음 수는 `test-planner`다.

**PR 둘이 리뷰를 기다린다.** [#382](https://github.com/tkyoun0421/la-bie-belle/pull/382)가 서체 넷을, [#383](https://github.com/tkyoun0421/la-bie-belle/pull/383)이 의존성 정렬과 번들 검사를 담는다.

**실기기 확인이 아직 남아 있다.** AC-01·02·03·04·05·10이 시뮬레이터나 실기기에서만 닫힌다 — `pnpm dev`가 대화형이라 세션에서 못 돌린다. 번들이 만들어진다는 것까지는 `pnpm bundle`이 확인했다.

**`sian-native-pass`도 `active`로 남아 있다.** 시안 열여섯이 ADR-012(브랜드 파랑, 헐거운 밀도) 기준으로 갱신돼 아티팩트로 올라갔고 사람의 승인을 기다린다.

**`e2e-runner`는 `ready`고 `expo-scaffold`가 선행이다.** 지금 `tdd-guard-e2e.py`는 `tests/e2e/`를 못 찾아 아무것도 안 막는 상태다 — 이 task가 도구(Maestro나 Detox)를 골라 첫 스펙을 세워야 게이트가 다시 문다.

**`plans-restate`는 `blocked`고 `expo-scaffold`가 선행이다.** 남은 plan 열둘이 골격 위에서 파일 배치와 검증 명령을 채우길 기다린다.

## 재개 맥락

회차 기록은 `docs/log/2026-09-21.md`(앞 회차)에 있다. 그 앞으로 account·schedule·attendance·payroll·notification·system 여섯 영역의 설계가 전부 닫혔고(#357~#378), 지금은 그 설계를 Expo 네이티브 전제로 옮기는 중이다.

**번들링이 죽어 있었고 아무 검사도 못 잡았다.** `react-native-svg@15.13.0`이 Node 내장 `buffer`를 import해서 Metro가 번들을 못 묶었는데, `pnpm lint`·`typecheck`·`test`·`format:check` 넷이 다 초록이었다 — 어느 것도 Metro를 돌리지 않는다. 상위가 15.15.3에서 고쳤고 Expo SDK 57이 고정한 값이 15.15.4다. `pnpm bundle`이 그 자리를 막는다([execution.md](4-test/execution.md#pnpm-bundle)).

**서체 유틸 이름이 문서와 실물에서 어긋나 있었다.** 컴파일 실측으로 닫았다 — Tailwind 4에서 `--font-*`는 패밀리 네임스페이스라 `font-medium`·`font-semibold`·`font-bold`가 `fontFamily`를 내고, 400은 `font-normal`이 아니라 `font-sans`다. `font-normal`은 `fontWeight: 400`만 걸어 패밀리를 안 바꾼다 — 그것만 쓰면 시스템 서체가 나온다. `tokens.md`와 `typography.md` 여섯 자리를 고쳤다.

**서체는 원본 넷이 9.4MB 그대로 들어간다.** `tokens.md`가 서브셋을 거친다고 적어둔 자리를 아직 안 채웠다 — `font-subset` task로 잡았다.

**스택이 Next.js에서 Expo로 넘어가는 중이다.** ADR-011이 웹 PWA를 버리고 Expo Router + NativeWind + Jest 조합으로 가기로 정했다. NativeWind는 아직 v5 RC다 — stable v4가 Tailwind 3을 요구하는데 디자인 정본이 Tailwind 4 위에 서 있어서다. 토큰 파이프라인은 실측으로 확인했다 — 네이티브 rem 16, `p-4`가 16, `text-base`가 17, 브랜드가 라이트 `#2f5cf6`·다크 `#628dfc`다.

**총괄이 정할 것 둘이 여전히 열려 있다.** [navigation Q-03](2-design/system/navigation.md#q-03) — 종이 QR을 앱 없는 기기로 찍으면 무엇이 뜨나. [runtime Q-01](2-design/system/runtime.md#q-01) — 오래 안 열었다 여는 앱이 무엇을 다시 읽나.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
