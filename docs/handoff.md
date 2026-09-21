# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 `session-recorder`가 덮어쓰고, 회차 중간이라도 작업 하나가 끝나면 총괄이 「다음 작업」을 갱신한다 — 어느 시점에든 새 세션이 여기서 이어받을 수 있어야 한다.

둘만 담는다 — 다음 작업과 재개 맥락. 열린 결정은 정본의 「아직 안 정한 것」에, 할 일은 `backlog.md`에, 정의문·훅의 마찰은 `observations/`에 산다. 상시 주의는 `docs/4-test/execution.md`와 `docs/5-deploy/environments.md`다.

## 다음 작업

**Expo Go로 실기기에서 앱이 뜨는 것부터 확인한다.** [`expo-scaffold`](backlog.md)(`active`)의 완료 조건 중 AC-01·05·07·08·09가 아직 미실행이다 — `pnpm dev`가 대화형이라 이번 회차에서 못 돌렸다. 실기기 확인이 끝나야 골격이 선 것으로 볼 수 있고, 그 뒤 남은 것이 서체 넷·세션·딥링크·진입 판정이다.

**`sian-native-pass`도 `active`로 남아 있다.** 시안 열여섯이 ADR-012(브랜드 파랑, 헐거운 밀도) 기준으로 갱신돼 아티팩트로 올라갔고 사람의 승인을 기다린다.

**`e2e-runner`는 `ready`고 `expo-scaffold`가 선행이다.** 지금 `tdd-guard-e2e.py`는 `tests/e2e/`를 못 찾아 아무것도 안 막는 상태다 — 이 task가 도구(Maestro나 Detox)를 골라 첫 스펙을 세워야 게이트가 다시 문다. CI의 앱 빌드·e2e 단계도 이 task와 EAS 설정이 돌아와야 다시 선다.

**`plans-restate`는 `blocked`고 `expo-scaffold`가 선행이다.** 남은 plan 열둘이 골격 위에서 파일 배치와 검증 명령을 채우길 기다린다.

## 재개 맥락

회차 기록은 `docs/log/2026-09-21.md`(이번 회차)와 `docs/log/2026-09-15.md`(문서 재편 마감)에 있다. 그 사이 account·schedule·attendance·payroll·notification·system 여섯 영역의 설계가 전부 닫혔고(#357~#378), 이번 회차가 그 설계를 Expo 네이티브 전제로 옮기는 첫 코드 변화다.

**스택이 Next.js에서 Expo로 넘어가는 중이다.** ADR-011이 웹 PWA를 버리고 Expo Router + NativeWind + Jest 조합으로 가기로 정했고, 이번 PR(#380)이 그 골격을 세우고 웹 전제 위에만 서던 파일 열여섯과 빈 디렉터리 다섯을 걷어냈다. NativeWind는 아직 v5 RC다 — stable v4가 Tailwind 3을 요구하는데 디자인 정본이 Tailwind 4 위에 서 있어서다. 토큰 파이프라인은 실측으로 확인했다 — 네이티브 rem 16, `p-4`가 16, `text-base`가 17, 브랜드가 라이트 `#2f5cf6`·다크 `#628dfc`이고 `tests/lint/native-compile-values.test.ts`가 그 값을 못박는다.

**테스트 러너가 vitest에서 Jest로 바뀌었다.** 481개가 같은 수, 같은 초록불로 넘어왔다. `pnpm test`·`pnpm lint`·`pnpm typecheck`·`pnpm format:check`가 통과하고 `pnpm test:integration:run`도 통과한다 — `pnpm dev`만 대화형이라 확인 못 했다.

**설계 층 전파 중 정본 충돌 셋이 났고 결정을 받아 닫았다.** 면의 안쪽 여백이 24px로 통일됐고(`spacing-shape.md`가 화면 문서 열셋을 따라갔다), 눈금 밖 여백 열셋이 이웃 눈금으로 당겨졌고, 대표 숫자(급여 금액·근무자 통계 합계)가 `fg.brand` 글자색으로 말하게 됐다 — 진한 색면을 주요 버튼이 이미 쓰고 있어서다. ListRow 오른쪽 값 조항도 갈렸다 — 「그 줄의 데이터면 `fg.neutral`, 화살표 달린 문의 현재 상태면 `fg.neutral-muted`」이고 가르는 질문은 「이 값을 보려고 이 화면에 왔는가」다.

**총괄이 정할 것 둘이 여전히 열려 있다.** [navigation Q-03](2-design/system/navigation.md#q-03) — 종이 QR을 앱 없는 기기로 찍으면 무엇이 뜨나. [runtime Q-01](2-design/system/runtime.md#q-01) — 오래 안 열었다 여는 앱이 무엇을 다시 읽나.

저장소 밖 자료 — 시안·문서 캔버스 [claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107](https://claude.ai/code/artifact/e3d33589-684d-4d7b-8b24-4c5190772107)(빌드 소스는 세션 임시 폴더라 다시 못 만든다), 하루 띠 비교 시안 [claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832](https://claude.ai/code/artifact/05c8b04f-ce99-4c57-8ab1-5e7728d53832).
