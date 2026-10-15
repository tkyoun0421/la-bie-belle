# 로그인 화면의 등장 모션과 구글 버튼 눌림

로그인 화면이 정적으로 뜬다. [login.md](../../2-design/modules/account/screens/login.md)의 「로그인 모션」 절은 다섯 요소가 차례로 아래에서 올라오며 밝아지고, 구글 버튼이 눌리는 동안 살짝 줄어든다고 정했다. 저장소에는 움직임 줄이기 설정을 읽는 손도, 어긋나 올리는 조각도, 눌림 스케일도 없다.

## 입력 명세·기준

모션의 값과 순서는 login.md 「로그인 모션」, 움직임 줄이기는 [motion.md](../../2-design/design-system/foundation/motion.md)의 접근성 절, 토큰은 [tokens.md](../../2-design/design-system/tokens.md) 6절이 정본이다.

## 판정 — 묻지 말고 이 꼴로 쓴다

**움직임 줄이기는 한 손이 읽는다.** `shared/lib/reduceMotion.lib.ts`가 `AccessibilityInfo`를 손으로 내고, `shared/hooks/useReduceMotion.ts`가 `isReduceMotionEnabled()` 읽기와 `reduceMotionChanged` 구독을 합쳐 참거짓을 낸다. 출처는 인자로 주입한다 — `logic` 갈래에서 `react-native` 대역이 구현에 안 닿는다. **읽기 전과 읽기 실패는 참(이동 없음)이다** — 첫 프레임에 설정을 모르는데 거짓으로 시작하면 움직임 줄이기를 켠 사람이 그 순간 이동을 본다. 늦게 온 읽기가 먼저 온 변경 이벤트를 덮지 않는다.

**등장은 조각 하나가 든다.** `shared/ui/Rise.tsx`가 `index`를 받아 `index × --stagger-step`만큼 기다렸다가 `--duration-slower` 동안 아래에서 올라오며 밝아진다. 계산은 `shared/utils/riseTiming.utils.ts`의 `riseTimingOf(index, reduceMotion)`이고 `{ delayMs, durationMs, distance }`를 낸다. 움직임 줄이기면 거리만 0이고 지연과 시간은 그대로다 — 시안의 reduced 블록이 지연을 안 건드린다. 모든 애니메이션 config에 `ReduceMotion.Never`를 단다. reanimated 기본값은 OS 설정이 켜지면 애니메이션을 통째로 건너뛰는데 정본은 「이동만 빼고 밝기는 남긴다」다. `Rise`는 `useEffect`를 못 쓰니(규칙 9) 마운트 때 한 번 도는 `entering`으로 시작한다 — 실패 줄이 바뀌어도 다시 안 돈다.

**눌림도 조각이다.** motion.md가 「화면 코드가 애니메이션을 짜지 않는다」고 해서 `shared/ui/PressScale.tsx`를 세우고 `GoogleSignInButton`이 그 안에 선다. 누르면 `--duration-fast` 동안 버튼 눌림 스케일로, 떼면 1로. `disabled`면 안 줄어든다. 움직임 줄이기에서도 남는다 — 자리를 옮기지 않는 변화이고 시안도 남긴다.

**거리를 토큰으로 옮긴다.** tokens.md 6절의 간격 표에 `--rise-distance` | 8px | 등장할 때 아래에서 올라오는 거리 를 더하고 「전개하면서 드러난 빈자리」의 같은 문단을 지운다. `pnpm tokens:css`로 `globals.css`를 다시 만든다.

**TS 상수는 tokens.md와 대조한다.** `shared/consts/motion.const.ts`가 등장 시간·계단 간격·거리·눌림 시간·눌림 스케일 다섯을 든다. `tests/lint/motionTokens.ts`가 `attendanceConstants`처럼 도구·픽스처·저장소 실물 셋으로 둘을 맞춘다. 한쪽만 고치면 빨개진다.

**순서는 마크·이름·설명·버튼·안내다.** 실패 줄은 안내의 자리(4번)에 선다.

**범위 밖.** `shared/ui/Button`의 눌림 스케일(정본은 모든 버튼에 요구한다), `Skeleton`에 움직임 줄이기 연결, `Segment`·`Draggable`의 125ms 리터럴은 따로 행이 든다.

## 변경 파일

| 자리 | 바꿀 책임 |
| --- | --- |
| `shared/lib/reduceMotion.lib.ts` | 새로. 설정 출처 |
| `shared/hooks/useReduceMotion.ts` + 짝 | 새로. 읽기와 구독 |
| `shared/utils/riseTiming.utils.ts` + 짝 | 새로. 지연·시간·거리 |
| `shared/consts/motion.const.ts` | 새로. 다섯 값 |
| `shared/ui/Rise.tsx`·`PressScale.tsx` + 짝 | 새로 |
| `screens/login/ui/LoginScreen.tsx`·`GoogleSignInButton.tsx` + 짝 | 다섯 요소를 `Rise`로, 버튼을 `PressScale`로 |
| `tests/lint/motionTokens.ts` + 짝 | 새로. tokens.md 대조 |
| `tokens.md` · `globals.css` | `--rise-distance` |

## 완료 조건

- **AC-01** 다섯 요소가 마크·이름·설명·버튼·안내 순으로 `index × 70ms` 지연, 300ms 동안 8px 아래에서 올라오며 밝아진다
- **AC-02** 움직임 줄이기면 거리만 0이고 밝기 변화와 지연은 남는다. 설정을 읽기 전과 읽기 실패는 움직임 줄이기로 친다
- **AC-03** 구글 버튼이 눌리는 동안 125ms로 0.97배가 되고, 안 눌리는 동안(`busy`)은 안 줄어든다
- **AC-04** TS 모션 상수 다섯이 tokens.md와 같고, 한쪽만 바꾸면 검사가 빨개진다
- **AC-05** 실패 줄이 떠도 등장이 다시 돌지 않는다

## 검증 방법

계산·읽기·대조는 unit, 조각과 화면 조립은 components 갈래가 든다. reanimated mock은 시간을 재지 못해 지연·시간은 넘긴 인자로 본다. 체감과 OS 설정 반영은 실기기 수동이다 — 움직임 줄이기를 켜고 콜드 스타트해 이동 없이 밝기만 바뀌는지, 버튼을 길게 눌러 줄어드는지 본다.
