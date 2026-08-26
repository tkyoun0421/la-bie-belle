# 모션

규칙과 근거를 담는다. duration과 스케일 값은 [tokens.md](../tokens.md#6-모션)에만 있다.

## duration 넷

| 토큰 | 쓰는 자리 |
| --- | --- |
| `--duration-fast` | 툴팁, 아주 작은 상태 변화 |
| `--duration-base` | 드롭다운, 팝오버, 대부분의 전환 |
| `--duration-slow` | 바텀시트, 화면 안 큰 덩이 |
| `--duration-slower` | 화면 전환 |

넷 다 일반 UI 전환의 상한 아래에 있다. 그 상한을 넘으면 기다리는 느낌이 들고, 사용자 입력에 대한 응답은 그보다 더 짧아야 즉각적으로 느껴진다. 버튼을 눌렀는데 반응이 늦으면 눌렸는지 의심하게 된다.

`--duration-base`는 드롭다운 실측에서 나왔다. 같은 동작이라도 열리는 시간이 짧을수록 앱이 빠르다고 읽힌다. `--duration-fast`는 툴팁 기준이다. 정보만 얹는 것이라 등장 과정을 볼 이유가 없다.

넷으로 나눈 구성은 Material Design 3의 duration 토큰 4단계를 참고했다. 어떤 값을 고를지는 IBM Carbon의 원칙을 따른다. **움직이는 거리가 멀수록 길게 준다.** 화면 전체가 밀려 들어오는 전환에 가장 짧은 토큰을 주면 순간이동으로 보이고, 툴팁 하나에 가장 긴 토큰을 주면 느리게 느껴진다. 같은 duration이라도 이동 거리가 다르면 체감이 다르다.

수치와 출처는 [tokens.md의 근거 수치](../tokens.md#근거-수치)에 있다.

easing은 토큰으로 정하지 않았다. Tailwind 기본 `ease-out`을 쓴다. 들어올 때 빠르게 시작해 부드럽게 멈추는 곡선이고, 등장 애니메이션 대부분이 여기 맞는다.

## 자주 일어나는 것은 움직이지 않는다

Apple HIG의 경고를 규칙으로 올린다. **자주 일어나는 인터랙션에는 모션을 더하지 않는다.**

한 번 보면 기분 좋은 애니메이션도 하루에 스무 번 보면 걸리적거린다. 목록을 스크롤하다 항목이 하나씩 페이드인하는 화면이 그렇다. 처음엔 세련돼 보이고 사흘 뒤엔 느려 보인다.

이 앱에서 자주 일어나는 것들이다.

- 근무표 달력의 월 넘기기
- 목록 스크롤
- 탭 이동
- 알림 목록 열기

여기에는 모션을 얹지 않거나 `--duration-fast`로 끝낸다.

모션을 얹을 자리는 상태가 실제로 바뀌는 순간이다. 바텀시트가 올라올 때, 팝오버가 열릴 때, 출근 인증이 끝날 때다.

## 눌림과 등장

**버튼은 누르는 동안 살짝 줄어든다.** 많이 줄이면 버튼이 찌그러져 보이고, 조금 줄이면 안 보인다. 토큰 값은 손가락 아래에서 눌렸다는 것만 전달하고 모양을 해치지 않는 선이다.

**등장 애니메이션은 0에서 시작하지 않는다.** 0에서 키우면 요소가 점에서 폭발하듯 나타난다. 거의 제 크기에서 시작하면 원래 있던 것이 제자리를 찾는 것처럼 보인다. `tw-animate-css`의 `zoom-in-95`가 그 범위 안이라 그대로 쓸 수 있다.

**팝오버는 `transform-origin`을 트리거 위치로 둔다.** 기본값인 중앙에서 자라면 팝오버가 트리거와 상관없는 곳에서 튀어나온 것처럼 보인다. 버튼 아래에 붙는 팝오버라면 원점이 위쪽 모서리여야 버튼에서 자라난 것으로 읽힌다.

## 접근성

`prefers-reduced-motion: reduce`가 켜져 있으면 **위치 이동을 없애고 opacity 크로스페이드는 남긴다.**

전부 끄지 않는 이유가 있다. 모션을 통째로 없애면 바텀시트가 깜빡 하고 나타나서 화면이 갑자기 바뀐 것인지 새 화면이 뜬 것인지 구분이 안 된다. 크로스페이드는 방향 감각을 흔들지 않으면서 "무언가 바뀌었다"는 것만 알린다.

멀미를 일으키는 것은 화면 안에서 무언가가 이동하는 것이지 밝기가 변하는 것이 아니다.

Tailwind에서는 `motion-safe:`를 이동 계열 클래스에만 붙이고 페이드는 그냥 둔다.

```
fade-in motion-safe:slide-in-from-bottom-4
```

이렇게 쓰면 설정을 켠 사람에게는 페이드만 남는다.

모션이 없으면 뜻이 안 통하는 화면은 만들지 않는다. 애니메이션은 이미 화면에 적혀 있는 것을 거들 뿐이어야 한다.

## 축하할 순간

토스에서 가져오는 것은 수치가 아니라 판단 기준이다. 토스는 duration을 공개하지 않았고 "언제 쓰는가"만 공개했다.

**로딩은 원형 회전 뒤에 체크로 끝낸다.** 돌기만 하다 사라지면 끝난 것인지 실패한 것인지 모른다. 체크가 결과를 알린다.

**강한 모션은 축하할 순간에만 쓴다.** 매번 축하하면 축하가 아니게 된다.

이 앱에서 확실한 축하는 하나다. **출근 인증 완료**다. 근무자가 현장에서 버튼을 누르고 그날 할 일을 하나 끝내는 순간이고, 되돌리는 길이 없어서([domain/attendance.md](../../domain/attendance.md)) 확실히 끝났다는 신호가 필요하다.

두 번째 후보였던 "급여 확정"은 대상을 못 정했다. [domain/payroll.md](../../domain/payroll.md)가 급여를 확정하지 않는다고 못 박아뒀다. 앱은 매번 다시 계산하고 잠그는 행위가 없다. 축하할 순간이 없다는 뜻인지, 주급이 새로 잡히는 월요일이 그 자리인지 사람이 정한다. [tokens.md의 미정 목록](../tokens.md#아직-안-정한-것)에 올려뒀다.

## base-ui에서 애니메이션 붙이기

shadcn/ui는 `@base-ui/react` 위에 올라가 있다. base-ui에는 애니메이션 엔진이 없다. 열림과 닫힘 같은 상태를 data attribute로 노출할 뿐이고, 어떻게 움직일지는 CSS나 JS 라이브러리에 맡긴다.

이건 빠진 기능이 아니라 설계다. 라이브러리가 애니메이션을 들고 있으면 그 라이브러리의 방식으로만 움직일 수 있다. data attribute만 내주면 CSS 전환이든 `@starting-style`이든 원하는 대로 붙는다.

우리는 CSS로 간다. `tw-animate-css`가 이미 설치돼 있어서 `animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-bottom` 같은 유틸을 그대로 쓴다.

```
data-open:animate-in data-open:fade-in data-open:zoom-in-95
data-closed:animate-out data-closed:fade-out
```

attribute 이름은 컴포넌트마다 다르니 base-ui 문서에서 그 컴포넌트 항목을 확인한다.

JS 애니메이션 라이브러리는 아직 안 넣는다. 위 목록으로 안 되는 화면이 실제로 나오면 그때 다시 본다.

## 출처

- [Material Design 3 — Motion duration tokens](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs)
- [IBM Carbon — Motion](https://carbondesignsystem.com/guidelines/motion/overview/)
- [Apple Human Interface Guidelines — Motion](https://developer.apple.com/design/human-interface-guidelines/motion)
- 토스 [Consumer UX Guide](https://developers-apps-in-toss.toss.im/design/consumer-ux-guide)

duration 근거의 원 출처는 [tokens.md](../tokens.md#근거-수치)에 있다.
