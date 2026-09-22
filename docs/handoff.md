# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**PR 셋을 리뷰하고 merge한다.** 셋이 쌓여 있어 순서가 있다 — [#383](https://github.com/tkyoun0421/la-bie-belle/pull/383)(의존성 정렬과 번들 검사)이 [#384](https://github.com/tkyoun0421/la-bie-belle/pull/384)(세션·딥링크·진입 판정)의 선행이고, [#382](https://github.com/tkyoun0421/la-bie-belle/pull/382)(서체 넷)는 따로 선다.

**#382와 #384가 `src/app/_layout.tsx`에서 부딪힌다.** 둘 다 `hideAsync()`를 부른다 — merge 뒤 맞는 모양은 서체 로딩과 진입 판정이 **둘 다** 끝났을 때 스플래시를 내리는 것이고, 어느 브랜치도 혼자서는 그 모양을 못 쓴다. 손으로 합쳐야 한다. `.env.example`도 둘이 같이 고쳤다 — 키 아홉이 든 #382 쪽이 온전하다.

**실기기 확인이 남아 있다.** AC-01·02·03·04·05·10과 세션 셋(앱 재시작 후 로그인 유지, 구글 로그인 왕복, 판정 전 스플래시 유지)이 시뮬레이터나 실기기에서만 닫힌다 — `pnpm dev`가 대화형이라 세션에서 못 돌린다. 번들이 만들어진다는 것까지는 `pnpm bundle`이 확인했다.

**구글 로그인 왕복은 로컬에서 못 본다.** `supabase/config.toml`에 구글 프로바이더가 없어서 `/auth/v1/authorize`가 400으로 끝난다. 실 Supabase 프로젝트와 구글 OAuth 클라이언트가 서야 하고, 그 자리는 [environments.md Q-01·Q-03](5-deploy/environments.md#q-01)이다.

**`sian-native-pass`도 `active`로 남아 있다.** 시안 열여섯이 ADR-012(브랜드 파랑, 헐거운 밀도) 기준으로 갱신돼 아티팩트로 올라갔고 사람의 승인을 기다린다.

**`e2e-runner`는 `ready`고 `expo-scaffold`가 선행이다.** 지금 `tdd-guard-e2e.py`는 `tests/e2e/`를 못 찾아 아무것도 안 막는 상태다 — 이 task가 도구(Maestro나 Detox)를 골라 첫 스펙을 세워야 게이트가 다시 문다.

**`plans-restate`는 `blocked`고 `expo-scaffold`가 선행이다.** 남은 plan 열둘이 골격 위에서 파일 배치와 검증 명령을 채우길 기다린다.

## 재개 맥락

회차 기록은 `docs/log/2026-09-21.md`(앞 회차)에 있다. 그 앞으로 account·schedule·attendance·payroll·notification·system 여섯 영역의 설계가 전부 닫혔고(#357~#378), 지금은 그 설계를 Expo 네이티브 전제로 옮기는 중이다.

**번들링이 죽어 있었고 아무 검사도 못 잡았다.** `react-native-svg@15.13.0`이 Node 내장 `buffer`를 import해서 Metro가 번들을 못 묶었는데, `pnpm lint`·`typecheck`·`test`·`format:check` 넷이 다 초록이었다 — 어느 것도 Metro를 돌리지 않는다. 상위가 15.15.3에서 고쳤고 Expo SDK 57이 고정한 값이 15.15.4다. `pnpm bundle`이 그 자리를 막는다([execution.md](4-test/execution.md#pnpm-bundle)).

**서체 유틸 이름이 문서와 실물에서 어긋나 있었다.** 컴파일 실측으로 닫았다 — Tailwind 4에서 `--font-*`는 패밀리 네임스페이스라 `font-medium`·`font-semibold`·`font-bold`가 `fontFamily`를 내고, 400은 `font-normal`이 아니라 `font-sans`다. `font-normal`은 `fontWeight: 400`만 걸어 패밀리를 안 바꾼다 — 그것만 쓰면 시스템 서체가 나온다. `tokens.md`와 `typography.md` 여섯 자리를 고쳤다.

**코드 교환이 목적지를 정하고 있었다.** `handle-auth-callback.ts`가 성공 시 `"/"`를 하드코딩해서 새로 들어온 사람도 `/pending` 대신 홈으로 갔다. 성공 여부만 알리게 좁혔고 목적지는 판정 껍데기가 정한다. `read-supabase-env.ts`가 아직 `NEXT_PUBLIC_*`를 읽던 것도 같이 잡았다 — Expo는 `EXPO_PUBLIC_*`만 번들에 인라인해서 실기기에서 env를 못 읽을 자리였다.

**판정이 실패할 때 가는 곳이 정본에 없었다.** 화면은 [login.md의 「읽기 실패 짜임」](2-design/modules/account/screens/login.md#읽기-실패-짜임)이 이미 그려뒀는데 경로가 빠져 있었다 — `/retry`로 박았고 게이트 경로가 넷에서 다섯이 됐다.

**`react-native`는 Jest에서 대역이 안 먹는다.** `moduleNameMapper`가 그 이름을 절대경로로 리매핑해서, 테스트가 직접 import할 때는 서지만 `src/`의 다른 파일이 안에서 부르면 진짜 모듈이 온다. `AppState`·`Linking`은 대역하지 말고 함수 인자로 주입한다 — [execution.md의 「돌릴 때」](4-test/execution.md#돌릴-때)에 넣었다. `jest` 객체가 전역이 아니라는 것도 같이 적었다.

**서체는 원본 넷이 9.4MB 그대로 들어간다.** `tokens.md`가 서브셋을 거친다고 적어둔 자리를 아직 안 채웠다 — `font-subset` task로 잡았다.

**스택이 Next.js에서 Expo로 넘어가는 중이다.** ADR-011이 웹 PWA를 버리고 Expo Router + NativeWind + Jest 조합으로 가기로 정했다. NativeWind는 아직 v5 RC다 — stable v4가 Tailwind 3을 요구하는데 디자인 정본이 Tailwind 4 위에 서 있어서다. 토큰 파이프라인은 실측으로 확인했다 — 네이티브 rem 16, `p-4`가 16, `text-base`가 17, 브랜드가 라이트 `#2f5cf6`·다크 `#628dfc`다.

**총괄이 정할 것 둘이 여전히 열려 있다.** [navigation Q-03](2-design/system/navigation.md#q-03) — 종이 QR을 앱 없는 기기로 찍으면 무엇이 뜨나. [runtime Q-01](2-design/system/runtime.md#q-01) — 오래 안 열었다 여는 앱이 무엇을 다시 읽나.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
