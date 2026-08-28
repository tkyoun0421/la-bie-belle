# 토큰

**이 파일이 값의 유일한 정본이다.** hex와 oklch, 픽셀 수치, 밀리초, 그림자 문자열, 대비비, 폰트 굵기 숫자는 전부 여기에만 적는다. 다른 디자인 시스템 문서는 토큰 이름으로만 말하고 값을 옮겨 적지 않는다.

이 파일은 값과 검증 결과만 담는다. 규칙과 근거가 어느 문서에 있는지는 [README.md](README.md)가 안내한다.

## 적응형 팔레트

색은 두 계층이다. 아래가 팔레트고 위가 역할 토큰이다. 화면 코드는 역할 토큰만 만진다.

팔레트가 적응형이다. 단계 이름이 밝기가 아니라 자리를 가리킨다. `neutral-100`은 라이트에서 밝은 회색이고 다크에서 어두운 회색이다. `neutral-1000`은 라이트에서 거의 검정, 다크에서 거의 흰색이다. 명도가 통째로 뒤집힌다.

그래서 아래의 역할 토큰 매핑표가 한 벌뿐이다. `fg.neutral = neutral-1000`이라고 한 번 적으면 라이트에서 검은 글자, 다크에서 흰 글자가 된다. 라이트용 표와 다크용 표를 따로 두지 않는다.

자세한 설명은 [foundation/color.md](foundation/color.md#적응형-2계층)에 있다.

---

## 1. 팔레트

계열 여섯, 단계 열하나다. CSS에는 oklch를 넣는다. hex는 값을 눈으로 확인하고 시안을 그릴 때 쓰는 참고치다.

명도 곡선은 여섯 계열이 공유한다.

| | 00 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 라이트 L | 1 | 0.965 | 0.905 | 0.845 | 0.76 | 0.68 | 0.625 | 0.545 | 0.455 | 0.32 | 0.215 |
| 다크 L | 0.155 | 0.205 | 0.265 | 0.32 | 0.4 | 0.48 | 0.585 | 0.665 | 0.745 | 0.845 | 0.935 |

### neutral

hue 57, chroma 최대 0.005.

| 단계 | 라이트 hex | 라이트 oklch | 다크 hex | 다크 oklch |
| --- | --- | --- | --- | --- |
| 00 | `#FFFEFD` | `oklch(1.000 0.0037 57)` | `#0D0C0B` | `oklch(0.155 0.0037 57)` |
| 100 | `#F5F3F1` | `oklch(0.965 0.0037 57)` | `#191715` | `oklch(0.205 0.0037 57)` |
| 200 | `#E2DFDD` | `oklch(0.905 0.0043 57)` | `#272523` | `oklch(0.265 0.0043 57)` |
| 300 | `#CECBC9` | `oklch(0.845 0.0045 57)` | `#353231` | `oklch(0.320 0.0045 57)` |
| 400 | `#B3B0AE` | `oklch(0.760 0.0047 57)` | `#4A4745` | `oklch(0.400 0.0047 57)` |
| 500 | `#9B9795` | `oklch(0.680 0.0050 57)` | `#605D5B` | `oklch(0.480 0.0050 57)` |
| 600 | `#8A8785` | `oklch(0.625 0.0050 57)` | `#7E7B79` | `oklch(0.585 0.0050 57)` |
| 700 | `#726F6D` | `oklch(0.545 0.0050 57)` | `#969391` | `oklch(0.665 0.0050 57)` |
| 800 | `#595654` | `oklch(0.455 0.0050 57)` | `#AFACA9` | `oklch(0.745 0.0050 57)` |
| 900 | `#353230` | `oklch(0.320 0.0053 57)` | `#CFCBC9` | `oklch(0.845 0.0053 57)` |
| 1000 | `#1B1917` | `oklch(0.215 0.0055 57)` | `#ECE9E6` | `oklch(0.935 0.0055 57)` |

### brand

hue 57, chroma 최대 0.058. neutral과 같은 hue다.

| 단계 | 라이트 hex | 라이트 oklch | 다크 hex | 다크 oklch |
| --- | --- | --- | --- | --- |
| 00 | `#FFFEFB` | `oklch(1.000 0.0058 57)` | `#0E0C0A` | `oklch(0.155 0.0058 57)` |
| 100 | `#FBF2EB` | `oklch(0.965 0.0128 57)` | `#1C1612` | `oklch(0.205 0.0128 57)` |
| 200 | `#ECDCD2` | `oklch(0.905 0.0220 57)` | `#2E231B` | `oklch(0.265 0.0220 57)` |
| 300 | `#DEC7B7` | `oklch(0.845 0.0336 57)` | `#402F22` | `oklch(0.320 0.0336 57)` |
| 400 | `#C8AA96` | `oklch(0.760 0.0452 57)` | `#5B422F` | `oklch(0.400 0.0452 57)` |
| 500 | `#B39078` | `oklch(0.680 0.0545 57)` | `#75563F` | `oklch(0.480 0.0545 57)` |
| 600 | `#A37F65` | `oklch(0.625 0.0580 57)` | `#97735A` | `oklch(0.585 0.0580 57)` |
| 700 | `#8A684F` | `oklch(0.545 0.0568 57)` | `#AF8B72` | `oklch(0.665 0.0568 57)` |
| 800 | `#6E4F39` | `oklch(0.455 0.0534 57)` | `#C7A48C` | `oklch(0.745 0.0534 57)` |
| 900 | `#442D1B` | `oklch(0.320 0.0452 57)` | `#E4C5B0` | `oklch(0.845 0.0452 57)` |
| 1000 | `#261508` | `oklch(0.215 0.0348 57)` | `#FCE4D4` | `oklch(0.935 0.0348 57)` |

### positive

hue 152, chroma 최대 0.115.

| 단계 | 라이트 hex | 라이트 oklch | 다크 hex | 다크 oklch |
| --- | --- | --- | --- | --- |
| 00 | `#FAFFFB` | `oklch(1.000 0.0115 152)` | `#090E0A` | `oklch(0.155 0.0115 152)` |
| 100 | `#E8F9EB` | `oklch(0.965 0.0253 152)` | `#0E1B11` | `oklch(0.205 0.0253 152)` |
| 200 | `#CBE9D2` | `oklch(0.905 0.0437 152)` | `#132B1A` | `oklch(0.265 0.0437 152)` |
| 300 | `#ACD9B7` | `oklch(0.845 0.0667 152)` | `#133C21` | `oklch(0.320 0.0667 152)` |
| 400 | `#85C295` | `oklch(0.760 0.0897 152)` | `#18552E` | `oklch(0.400 0.0897 152)` |
| 500 | `#61AB77` | `oklch(0.680 0.1081 152)` | `#216E3E` | `oklch(0.480 0.1081 152)` |
| 600 | `#4B9B64` | `oklch(0.625 0.1150 152)` | `#3E8F59` | `oklch(0.585 0.1150 152)` |
| 700 | `#33824E` | `oklch(0.545 0.1127 152)` | `#59A771` | `oklch(0.665 0.1127 152)` |
| 800 | `#1A6738` | `oklch(0.455 0.1058 152)` | `#77C08B` | `oklch(0.745 0.1058 152)` |
| 900 | `#003F1A` | `oklch(0.320 0.0897 152)` | `#A0DEB0` | `oklch(0.845 0.0897 152)` |
| 1000 | `#002207` | `oklch(0.215 0.0690 152)` | `#C8F8D3` | `oklch(0.935 0.0690 152)` |

### warning

hue 88, chroma 최대 0.16. **글자색으로 쓰지 않는다.** 이유는 [foundation/color.md](foundation/color.md#경고색-제약)에 있다.

| 단계 | 라이트 hex | 라이트 oklch | 다크 hex | 다크 oklch |
| --- | --- | --- | --- | --- |
| 00 | `#FFFFF3` | `oklch(1.000 0.0160 88)` | `#0F0C05` | `oklch(0.155 0.0160 88)` |
| 100 | `#FDF3D9` | `oklch(0.965 0.0352 88)` | `#1E1603` | `oklch(0.205 0.0352 88)` |
| 200 | `#F0DEB2` | `oklch(0.905 0.0608 88)` | `#312300` | `oklch(0.265 0.0608 88)` |
| 300 | `#E5C985` | `oklch(0.845 0.0928 88)` | `#462E00` | `oklch(0.320 0.0928 88)` |
| 400 | `#D2AC48` | `oklch(0.760 0.1248 88)` | `#634100` | `oklch(0.400 0.1248 88)` |
| 500 | `#BF9100` | `oklch(0.680 0.1504 88)` | `#805500` | `oklch(0.480 0.1504 88)` |
| 600 | `#B07F00` | `oklch(0.625 0.1600 88)` | `#A37300` | `oklch(0.585 0.1600 88)` |
| 700 | `#966700` | `oklch(0.545 0.1568 88)` | `#BC8C00` | `oklch(0.665 0.1568 88)` |
| 800 | `#784E00` | `oklch(0.455 0.1472 88)` | `#D3A619` | `oklch(0.745 0.1472 88)` |
| 900 | `#4D2B00` | `oklch(0.320 0.1248 88)` | `#EEC765` | `oklch(0.845 0.1248 88)` |
| 1000 | `#2B1300` | `oklch(0.215 0.0960 88)` | `#FFE79E` | `oklch(0.935 0.0960 88)` |

### critical

hue 27, chroma 최대 0.145.

| 단계 | 라이트 hex | 라이트 oklch | 다크 hex | 다크 oklch |
| --- | --- | --- | --- | --- |
| 00 | `#FFFCFA` | `oklch(1.000 0.0145 27)` | `#120A09` | `oklch(0.155 0.0145 27)` |
| 100 | `#FFECE8` | `oklch(0.965 0.0319 27)` | `#24110F` | `oklch(0.205 0.0319 27)` |
| 200 | `#FFD3CC` | `oklch(0.905 0.0551 27)` | `#3C1916` | `oklch(0.265 0.0551 27)` |
| 300 | `#FFB8AF` | `oklch(0.845 0.0841 27)` | `#561E1A` | `oklch(0.320 0.0841 27)` |
| 400 | `#F0948A` | `oklch(0.760 0.1131 27)` | `#792924` | `oklch(0.400 0.1131 27)` |
| 500 | `#E07469` | `oklch(0.680 0.1363 27)` | `#9C3730` | `oklch(0.480 0.1363 27)` |
| 600 | `#D16056` | `oklch(0.625 0.1450 27)` | `#C3534B` | `oklch(0.585 0.1450 27)` |
| 700 | `#B44840` | `oklch(0.545 0.1421 27)` | `#DD6D63` | `oklch(0.665 0.1421 27)` |
| 800 | `#93302B` | `oklch(0.455 0.1334 27)` | `#F5897E` | `oklch(0.745 0.1334 27)` |
| 900 | `#60100F` | `oklch(0.320 0.1131 27)` | `#FFAFA4` | `oklch(0.845 0.1131 27)` |
| 1000 | `#380002` | `oklch(0.215 0.0870 27)` | `#FFD4CA` | `oklch(0.935 0.0870 27)` |

### informative

hue 248, chroma 최대 0.115.

| 단계 | 라이트 hex | 라이트 oklch | 다크 hex | 다크 oklch |
| --- | --- | --- | --- | --- |
| 00 | `#F9FFFF` | `oklch(1.000 0.0115 248)` | `#080D11` | `oklch(0.155 0.0115 248)` |
| 100 | `#E7F5FF` | `oklch(0.965 0.0253 248)` | `#0E1822` | `oklch(0.205 0.0253 248)` |
| 200 | `#CAE3FC` | `oklch(0.905 0.0437 248)` | `#132739` | `oklch(0.265 0.0437 248)` |
| 300 | `#AAD1F6` | `oklch(0.845 0.0667 248)` | `#133553` | `oklch(0.320 0.0667 248)` |
| 400 | `#83B6E8` | `oklch(0.760 0.0897 248)` | `#184A75` | `oklch(0.400 0.0897 248)` |
| 500 | `#5F9ED8` | `oklch(0.680 0.1081 248)` | `#216197` | `oklch(0.480 0.1081 248)` |
| 600 | `#498DC9` | `oklch(0.625 0.1150 248)` | `#3D80BC` | `oklch(0.585 0.1150 248)` |
| 700 | `#3274AE` | `oklch(0.545 0.1127 248)` | `#5799D5` | `oklch(0.665 0.1127 248)` |
| 800 | `#1B5A8E` | `oklch(0.455 0.1058 248)` | `#75B2EC` | `oklch(0.745 0.1058 248)` |
| 900 | `#00355E` | `oklch(0.320 0.0897 248)` | `#9DD2FF` | `oklch(0.845 0.0897 248)` |
| 1000 | `#001A37` | `oklch(0.215 0.0690 248)` | `#C6EFFF` | `oklch(0.935 0.0690 248)` |

---

## 2. 역할 토큰

이름은 `Property.Role-Variant-State`다. Property 셋(`fg` `bg` `stroke`), Role 여섯(neutral brand positive warning critical informative), Variant는 solid·weak·muted·subtle·contrast, State는 pressed·selected·disabled.

문법의 뜻은 [foundation/color.md](foundation/color.md#variant와-state)에 있다.

**팔레트 열은 한 벌뿐이다.** 라이트와 다크가 같은 단계를 가리키고 팔레트가 알아서 뒤집힌다.

### bg

| 토큰 | 팔레트 | 라이트 | 다크 | Tailwind 유틸 |
| --- | --- | --- | --- | --- |
| `bg.neutral` | neutral-00 | `#FFFEFD` | `#0D0C0B` | `bg-bg-neutral` |
| `bg.neutral-weak` | neutral-100 | `#F5F3F1` | `#191715` | `bg-bg-neutral-weak` |
| `bg.neutral-weak-pressed` | neutral-200 | `#E2DFDD` | `#272523` | `bg-bg-neutral-weak-pressed` |
| `bg.neutral-solid` | neutral-1000 | `#1B1917` | `#ECE9E6` | `bg-bg-neutral-solid` |
| `bg.neutral-disabled` | neutral-100 | `#F5F3F1` | `#191715` | `bg-bg-neutral-disabled` |
| `bg.brand-solid` | brand-800 | `#6E4F39` | `#C7A48C` | `bg-bg-brand-solid` |
| `bg.brand-solid-pressed` | brand-900 | `#442D1B` | `#E4C5B0` | `bg-bg-brand-solid-pressed` |
| `bg.brand-weak` | brand-100 | `#FBF2EB` | `#1C1612` | `bg-bg-brand-weak` |
| `bg.brand-weak-pressed` | brand-200 | `#ECDCD2` | `#2E231B` | `bg-bg-brand-weak-pressed` |
| `bg.brand-weak-selected` | brand-100 | `#FBF2EB` | `#1C1612` | `bg-bg-brand-weak-selected` |
| `bg.positive-weak` | positive-100 | `#E8F9EB` | `#0E1B11` | `bg-bg-positive-weak` |
| `bg.warning-weak` | warning-100 | `#FDF3D9` | `#1E1603` | `bg-bg-warning-weak` |
| `bg.critical-solid` | critical-800 | `#93302B` | `#F5897E` | `bg-bg-critical-solid` |
| `bg.critical-solid-pressed` | critical-900 | `#60100F` | `#FFAFA4` | `bg-bg-critical-solid-pressed` |
| `bg.critical-weak` | critical-100 | `#FFECE8` | `#24110F` | `bg-bg-critical-weak` |
| `bg.informative-weak` | informative-100 | `#E7F5FF` | `#0E1822` | `bg-bg-informative-weak` |

### fg

| 토큰 | 팔레트 | 라이트 | 다크 | Tailwind 유틸 |
| --- | --- | --- | --- | --- |
| `fg.neutral` | neutral-1000 | `#1B1917` | `#ECE9E6` | `text-fg-neutral` |
| `fg.neutral-muted` | neutral-800 | `#595654` | `#AFACA9` | `text-fg-neutral-muted` |
| `fg.neutral-subtle` | neutral-700 | `#726F6D` | `#969391` | `text-fg-neutral-subtle` |
| `fg.neutral-contrast` | neutral-00 | `#FFFEFD` | `#0D0C0B` | `text-fg-neutral-contrast` |
| `fg.neutral-disabled` | neutral-700 | `#726F6D` | `#969391` | `text-fg-neutral-disabled` |
| `fg.brand` | brand-800 | `#6E4F39` | `#C7A48C` | `text-fg-brand` |
| `fg.brand-contrast` | neutral-00 | `#FFFEFD` | `#0D0C0B` | `text-fg-brand-contrast` |
| `fg.positive` | positive-800 | `#1A6738` | `#77C08B` | `text-fg-positive` |
| `fg.critical` | critical-800 | `#93302B` | `#F5897E` | `text-fg-critical` |
| `fg.informative` | informative-800 | `#1B5A8E` | `#75B2EC` | `text-fg-informative` |

`fg.warning`은 없다. 만들지 않은 것이라 나중에 필요해 보여도 더하지 않는다.

### stroke

| 토큰 | 팔레트 | 라이트 | 다크 | Tailwind 유틸 |
| --- | --- | --- | --- | --- |
| `stroke.neutral` | neutral-200 | `#E2DFDD` | `#272523` | `border-stroke-neutral` |
| `stroke.neutral-muted` | neutral-300 | `#CECBC9` | `#353231` | `border-stroke-neutral-muted` |
| `stroke.neutral-disabled` | neutral-200 | `#E2DFDD` | `#272523` | `border-stroke-neutral-disabled` |
| `stroke.brand-solid` | brand-800 | `#6E4F39` | `#C7A48C` | `border-stroke-brand-solid` |
| `stroke.surface` | — | `transparent` | `#272523` | `border-stroke-surface` |

`stroke.surface`는 새 색이 아니다. 라이트에서 그림자로 면을 띄우고 다크에서 선으로 나누는 규칙을 클래스 한 벌로 굴리려고 둔 것이라 라이트에서는 투명이고 다크에서 `neutral-200`을 가리킨다. 근거는 [foundation/spacing-shape.md](foundation/spacing-shape.md#그림자와-면-나누기)에 있다.

### 팔레트를 직접 쓰는 유일한 자리

경고 아이콘이다. `warning-500`을 쓰고 유틸은 `text-warning-500`이다. 라이트 `#BF9100`, 다크 `#805500`.

---

## 3. 타이포그래피

7단계다. 이름은 Tailwind 기본 이름을 그대로 두고 값만 갈아끼웠다. 이유는 [foundation/typography.md](foundation/typography.md#스케일)에 있다.

| 유틸 | 크기 | 행간 | rem 크기 | rem 행간 | 용도 |
| --- | --- | --- | --- | --- | --- |
| `text-3xl` | 30px | 40px | 1.875 | 2.5 | 아주 큰 제목 |
| `text-2xl` | 26px | 35px | 1.625 | 2.1875 | 큰 제목 |
| `text-xl` | 22px | 31px | 1.375 | 1.9375 | 일반 제목 |
| `text-lg` | 20px | 29px | 1.25 | 1.8125 | 작은 제목 |
| `text-base` | 17px | 25.5px | 1.0625 | 1.59375 | 일반 본문 |
| `text-sm` | 15px | 22.5px | 0.9375 | 1.40625 | 작은 본문 |
| `text-xs` | 13px | 19.5px | 0.8125 | 1.21875 | 부가 텍스트 |

`text-4xl`부터 위는 지웠다.

굵기 넷이다. Tailwind 기본값과 같아서 갈아끼울 것이 없고, 쓰지 않는 다섯(`thin` `extralight` `light` `extrabold` `black`)을 지웠다.

| 유틸 | 값 |
| --- | --- |
| `font-normal` | 400 |
| `font-medium` | 500 |
| `font-semibold` | 600 |
| `font-bold` | 700 |

`light`가 지운 쪽에 든 것은 Wanted Sans의 가변 축이 400에서 시작하기 때문이다. `font-light`를 걸어도 300이 400으로 눌려서 `font-normal`과 같은 글자가 나온다. 아무것도 안 하는 유틸을 남겨두면 언젠가 누군가 그걸로 무게를 낮추려 한다.

숫자는 자릿수가 줄맞춤돼야 하는 자리에서 `font-variant-numeric: tabular-nums`를 쓴다. 유틸은 `tabular-nums`고 급여 금액과 근무 시간이 그 자리다. 규칙은 [foundation/typography.md](foundation/typography.md#숫자-정렬)에 있다.

### 서체 연결

Wanted Sans를 jsdelivr의 조각 나눔 스타일시트로 가져온다. **저장소에 폰트 파일을 넣지 않는다.**

```html
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin="anonymous" />
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.css"
/>
```

이 스타일시트는 `@font-face` 아흔둘을 `unicode-range`로 갈라둔다. 브라우저는 그중 화면에 실제로 찍힌 글자가 든 조각만 받는다. 조각 하나가 25KB 남짓이라 첫 화면이 100~300KB로 끝난다. 통짜 한 장은 1,259KB고 첫 글자를 그리기 전에 그걸 다 받아야 한다.

`@font-face`가 선언하는 이름이 `Wanted Sans Variable`이고, 아래 `@theme inline`의 `--font-sans`가 그 이름을 첫 자리에 둔다. `font-display: swap`은 스타일시트가 이미 걸어두었다.

고른 이유와 라이선스는 [foundation/typography.md](foundation/typography.md#서체)에 있다.

---

## 4. 스페이싱

4px 기준이고 눈금은 열셋이다.

Tailwind의 `--spacing` 기본값이 `0.25rem`이라 유틸 숫자에 4를 곱하면 px가 나온다. `p-2`는 8px, `gap-6`은 24px이다. 기본값을 그대로 두었으니 `@theme`에 적을 것이 없다.

| px | 유틸 숫자 |
| --- | --- |
| 0 | `0` |
| 2 | `0.5` |
| 4 | `1` |
| 6 | `1.5` |
| 8 | `2` |
| 12 | `3` |
| 16 | `4` |
| 20 | `5` |
| 24 | `6` |
| 32 | `8` |
| 40 | `10` |
| 48 | `12` |
| 64 | `16` |

눈금 밖 숫자도 Tailwind가 만들어준다. 쓰지 않는 이유는 [foundation/spacing-shape.md](foundation/spacing-shape.md#눈금-밖-숫자)에 있다.

이 눈금은 우리가 정했다. 타이포그래피와 달리 TDS가 스페이싱을 공개하지 않았다.

---

## 5. 라운딩과 그림자

| 유틸 | 값 | 쓰는 자리 |
| --- | --- | --- |
| `rounded-none` | 0 | 화면 폭에 붙는 면 |
| `rounded-xs` | 4px | 아직 배정 없음 |
| `rounded-sm` | 8px | 아직 배정 없음 |
| `rounded-md` | 12px | 입력 |
| `rounded-lg` | 16px | 작은 카드, 다이얼로그 |
| `rounded-xl` | 20px | 카드 |
| `rounded-full` | 9999px | 버튼, 배지 |

그림자는 하나뿐이고 라이트에서만 보인다.

| 유틸 | 라이트 | 다크 |
| --- | --- | --- |
| `shadow-card` | `0 1px 2px rgba(28,25,22,.05), 0 8px 20px -14px rgba(28,25,22,.4)` | `none` |

다크에서는 그림자가 사라지고 `border-stroke-surface`가 선을 그린다. 클래스는 양쪽에서 같다. 근거는 [foundation/spacing-shape.md](foundation/spacing-shape.md#그림자와-면-나누기)에 있다.

---

## 6. 모션

| 변수 | 값 | Tailwind 유틸 | 쓰는 자리 |
| --- | --- | --- | --- |
| `--duration-fast` | 125ms | `duration-125` | 툴팁, 아주 작은 상태 변화 |
| `--duration-base` | 180ms | `duration-180` | 드롭다운, 팝오버, 대부분의 전환 |
| `--duration-slow` | 240ms | `duration-240` | 바텀시트, 화면 안 큰 덩이 |
| `--duration-slower` | 300ms | `duration-300` | 화면 전환 |

easing은 토큰으로 정하지 않았다. Tailwind 기본 `ease-out`을 쓴다. cubic-bezier를 직접 적는 자리는 없다.

스케일 값 둘이다.

| 자리 | 값 |
| --- | --- |
| 버튼 눌림 | `scale(0.97)` |
| 등장 시작 스케일 최솟값 | `0.9` |

등장에는 `tw-animate-css`의 `zoom-in-95`를 쓴다. 시작값이 위 최솟값 안에 든다.

### 근거 수치

위 넷을 어디서 가져왔는지다. 규칙은 [foundation/motion.md](foundation/motion.md)에 있다.

| 관찰 | 출처 |
| --- | --- |
| 일반 UI 전환은 300ms 이하 | Emil Kowalski |
| 인터랙션 응답은 200ms 이하여야 즉각적으로 느껴진다 | Emil Kowalski |
| 드롭다운은 180ms가 400ms보다 반응성이 좋다 | Emil Kowalski |
| 툴팁은 125ms | Rauno Freiberg |

- Emil Kowalski, [7 practical animation tips](https://emilkowal.ski/ui/7-practical-animation-tips)
- Rauno Freiberg, [Interface Guidelines](https://github.com/raunofreiberg/interfaces)

넷으로 나눈 구성은 [Material Design 3의 duration 토큰](https://m3.material.io/styles/motion/easing-and-duration/tokens-specs) 4단계를 참고했고, 어느 값을 고를지는 [IBM Carbon](https://carbondesignsystem.com/guidelines/motion/overview/)의 "이동 거리에 비례" 원칙을 따른다.

---

## 7. 대비 검증

측정한 조합 전부가 WCAG AA 본문 기준 4.5:1을 넘는다.

| 조합 | 라이트 | 다크 |
| --- | --- | --- |
| `fg.neutral` on `bg.neutral` | 15.84 | 16.16 |
| `fg.neutral-muted` on `bg.neutral` | 7.23 | 7.91 |
| `fg.neutral-subtle` on `bg.neutral` | 4.95 | 5.86 |
| `fg.brand` on `bg.neutral` | 6.68 | 8.48 |
| `fg.brand-contrast` on `bg.brand-solid` | 7.39 | 8.48 |
| `fg.positive` on `bg.neutral` | 6.86 | 8.25 |
| `fg.critical` on `bg.neutral` | 7.73 | 7.46 |
| `fg.informative` on `bg.neutral` | 7.19 | 7.95 |
| `fg.neutral-disabled` on `bg.neutral-disabled` | 4.51 | 5.86 |

비활성 글자도 읽혀야 해서 이 줄을 기준 아래로 내리지 않았다. 버튼이 왜 눌리지 않는지는 대개 그 버튼에 적힌 글자가 알려준다.

### 떨어진 조합

| 조합 | 결과 | 판정 |
| --- | --- | --- |
| neutral-600 on `bg.neutral` (라이트) | 3.56 | `fg.neutral-subtle`에서 탈락. neutral-700으로 올렸다 |
| neutral-600 on `bg.neutral-disabled` (라이트) | 3.22 | `fg.neutral-disabled`에서 탈락. neutral-700이 넷 중 유일하게 기준을 넘었다 |
| brand-800 vs warning-800 (라이트) | 1.02 | 사실상 같은 밝기. warning을 글자색에서 뺐다 |

두 판정의 근거는 [foundation/color.md](foundation/color.md#대비-검증)와 [경고색 제약](foundation/color.md#경고색-제약)에 있다.

새 조합을 만들 때는 측정하고 이 표에 줄을 더한다. 눈으로 판정하지 않는다.

---

## 8. CSS 전문

아래 여섯 블록을 순서대로 이어 붙이면 `src/app/globals.css` 한 벌이 된다. 어긋나면 `tests/lint/token-css-parity.test.ts`가 잡는다.

`@theme inline`을 쓰는 이유는 Tailwind 4의 동작 때문이다. 그냥 `@theme`은 값을 `:root`에서 한 번 굳혀버려서, 다크에서 팔레트가 바뀌어도 유틸이 옛 값을 계속 가리킨다. `inline`은 유틸에 `var()`를 그대로 심어 요소 자리에서 값을 풀게 한다.

### 8.1 라이트

```css
@import "tailwindcss";

:root {
  color-scheme: light;

  --palette-neutral-00: oklch(1.000 0.0037 57);
  --palette-neutral-100: oklch(0.965 0.0037 57);
  --palette-neutral-200: oklch(0.905 0.0043 57);
  --palette-neutral-300: oklch(0.845 0.0045 57);
  --palette-neutral-400: oklch(0.760 0.0047 57);
  --palette-neutral-500: oklch(0.680 0.0050 57);
  --palette-neutral-600: oklch(0.625 0.0050 57);
  --palette-neutral-700: oklch(0.545 0.0050 57);
  --palette-neutral-800: oklch(0.455 0.0050 57);
  --palette-neutral-900: oklch(0.320 0.0053 57);
  --palette-neutral-1000: oklch(0.215 0.0055 57);

  --palette-brand-00: oklch(1.000 0.0058 57);
  --palette-brand-100: oklch(0.965 0.0128 57);
  --palette-brand-200: oklch(0.905 0.0220 57);
  --palette-brand-300: oklch(0.845 0.0336 57);
  --palette-brand-400: oklch(0.760 0.0452 57);
  --palette-brand-500: oklch(0.680 0.0545 57);
  --palette-brand-600: oklch(0.625 0.0580 57);
  --palette-brand-700: oklch(0.545 0.0568 57);
  --palette-brand-800: oklch(0.455 0.0534 57);
  --palette-brand-900: oklch(0.320 0.0452 57);
  --palette-brand-1000: oklch(0.215 0.0348 57);

  --palette-positive-00: oklch(1.000 0.0115 152);
  --palette-positive-100: oklch(0.965 0.0253 152);
  --palette-positive-200: oklch(0.905 0.0437 152);
  --palette-positive-300: oklch(0.845 0.0667 152);
  --palette-positive-400: oklch(0.760 0.0897 152);
  --palette-positive-500: oklch(0.680 0.1081 152);
  --palette-positive-600: oklch(0.625 0.1150 152);
  --palette-positive-700: oklch(0.545 0.1127 152);
  --palette-positive-800: oklch(0.455 0.1058 152);
  --palette-positive-900: oklch(0.320 0.0897 152);
  --palette-positive-1000: oklch(0.215 0.0690 152);

  --palette-warning-00: oklch(1.000 0.0160 88);
  --palette-warning-100: oklch(0.965 0.0352 88);
  --palette-warning-200: oklch(0.905 0.0608 88);
  --palette-warning-300: oklch(0.845 0.0928 88);
  --palette-warning-400: oklch(0.760 0.1248 88);
  --palette-warning-500: oklch(0.680 0.1504 88);
  --palette-warning-600: oklch(0.625 0.1600 88);
  --palette-warning-700: oklch(0.545 0.1568 88);
  --palette-warning-800: oklch(0.455 0.1472 88);
  --palette-warning-900: oklch(0.320 0.1248 88);
  --palette-warning-1000: oklch(0.215 0.0960 88);

  --palette-critical-00: oklch(1.000 0.0145 27);
  --palette-critical-100: oklch(0.965 0.0319 27);
  --palette-critical-200: oklch(0.905 0.0551 27);
  --palette-critical-300: oklch(0.845 0.0841 27);
  --palette-critical-400: oklch(0.760 0.1131 27);
  --palette-critical-500: oklch(0.680 0.1363 27);
  --palette-critical-600: oklch(0.625 0.1450 27);
  --palette-critical-700: oklch(0.545 0.1421 27);
  --palette-critical-800: oklch(0.455 0.1334 27);
  --palette-critical-900: oklch(0.320 0.1131 27);
  --palette-critical-1000: oklch(0.215 0.0870 27);

  --palette-informative-00: oklch(1.000 0.0115 248);
  --palette-informative-100: oklch(0.965 0.0253 248);
  --palette-informative-200: oklch(0.905 0.0437 248);
  --palette-informative-300: oklch(0.845 0.0667 248);
  --palette-informative-400: oklch(0.760 0.0897 248);
  --palette-informative-500: oklch(0.680 0.1081 248);
  --palette-informative-600: oklch(0.625 0.1150 248);
  --palette-informative-700: oklch(0.545 0.1127 248);
  --palette-informative-800: oklch(0.455 0.1058 248);
  --palette-informative-900: oklch(0.320 0.0897 248);
  --palette-informative-1000: oklch(0.215 0.0690 248);

  --surface-shadow: 0 1px 2px rgba(28, 25, 22, 0.05), 0 8px 20px -14px rgba(28, 25, 22, 0.4);
  --surface-stroke: transparent;
}
```

### 8.2 다크

기기 설정을 따라가는 길과 `data-theme`로 못 박는 길 둘 다 걸어둔다. `[data-theme="light"]`가 붙어 있으면 기기가 다크여도 라이트로 남는다.

`@custom-variant dark`가 같은 규칙을 `dark:` 유틸리티 쪽에도 건다. Tailwind의 기본 `dark:`는 미디어 쿼리만 보기 때문에, 이것이 없으면 팔레트는 `[data-theme="dark"]`를 따라 뒤집히는데 `dark:` 클래스를 단 자리만 라이트로 남는다. 갈래 둘의 조건이 위 팔레트 블록 둘과 정확히 같아야 한다.

```css
@custom-variant dark {
  &:where([data-theme="dark"], [data-theme="dark"] *) {
    @slot;
  }

  @media (prefers-color-scheme: dark) {
    &:where(:not([data-theme="light"], [data-theme="light"] *)) {
      @slot;
    }
  }
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;

    --palette-neutral-00: oklch(0.155 0.0037 57);
    --palette-neutral-100: oklch(0.205 0.0037 57);
    --palette-neutral-200: oklch(0.265 0.0043 57);
    --palette-neutral-300: oklch(0.320 0.0045 57);
    --palette-neutral-400: oklch(0.400 0.0047 57);
    --palette-neutral-500: oklch(0.480 0.0050 57);
    --palette-neutral-600: oklch(0.585 0.0050 57);
    --palette-neutral-700: oklch(0.665 0.0050 57);
    --palette-neutral-800: oklch(0.745 0.0050 57);
    --palette-neutral-900: oklch(0.845 0.0053 57);
    --palette-neutral-1000: oklch(0.935 0.0055 57);

    --palette-brand-00: oklch(0.155 0.0058 57);
    --palette-brand-100: oklch(0.205 0.0128 57);
    --palette-brand-200: oklch(0.265 0.0220 57);
    --palette-brand-300: oklch(0.320 0.0336 57);
    --palette-brand-400: oklch(0.400 0.0452 57);
    --palette-brand-500: oklch(0.480 0.0545 57);
    --palette-brand-600: oklch(0.585 0.0580 57);
    --palette-brand-700: oklch(0.665 0.0568 57);
    --palette-brand-800: oklch(0.745 0.0534 57);
    --palette-brand-900: oklch(0.845 0.0452 57);
    --palette-brand-1000: oklch(0.935 0.0348 57);

    --palette-positive-00: oklch(0.155 0.0115 152);
    --palette-positive-100: oklch(0.205 0.0253 152);
    --palette-positive-200: oklch(0.265 0.0437 152);
    --palette-positive-300: oklch(0.320 0.0667 152);
    --palette-positive-400: oklch(0.400 0.0897 152);
    --palette-positive-500: oklch(0.480 0.1081 152);
    --palette-positive-600: oklch(0.585 0.1150 152);
    --palette-positive-700: oklch(0.665 0.1127 152);
    --palette-positive-800: oklch(0.745 0.1058 152);
    --palette-positive-900: oklch(0.845 0.0897 152);
    --palette-positive-1000: oklch(0.935 0.0690 152);

    --palette-warning-00: oklch(0.155 0.0160 88);
    --palette-warning-100: oklch(0.205 0.0352 88);
    --palette-warning-200: oklch(0.265 0.0608 88);
    --palette-warning-300: oklch(0.320 0.0928 88);
    --palette-warning-400: oklch(0.400 0.1248 88);
    --palette-warning-500: oklch(0.480 0.1504 88);
    --palette-warning-600: oklch(0.585 0.1600 88);
    --palette-warning-700: oklch(0.665 0.1568 88);
    --palette-warning-800: oklch(0.745 0.1472 88);
    --palette-warning-900: oklch(0.845 0.1248 88);
    --palette-warning-1000: oklch(0.935 0.0960 88);

    --palette-critical-00: oklch(0.155 0.0145 27);
    --palette-critical-100: oklch(0.205 0.0319 27);
    --palette-critical-200: oklch(0.265 0.0551 27);
    --palette-critical-300: oklch(0.320 0.0841 27);
    --palette-critical-400: oklch(0.400 0.1131 27);
    --palette-critical-500: oklch(0.480 0.1363 27);
    --palette-critical-600: oklch(0.585 0.1450 27);
    --palette-critical-700: oklch(0.665 0.1421 27);
    --palette-critical-800: oklch(0.745 0.1334 27);
    --palette-critical-900: oklch(0.845 0.1131 27);
    --palette-critical-1000: oklch(0.935 0.0870 27);

    --palette-informative-00: oklch(0.155 0.0115 248);
    --palette-informative-100: oklch(0.205 0.0253 248);
    --palette-informative-200: oklch(0.265 0.0437 248);
    --palette-informative-300: oklch(0.320 0.0667 248);
    --palette-informative-400: oklch(0.400 0.0897 248);
    --palette-informative-500: oklch(0.480 0.1081 248);
    --palette-informative-600: oklch(0.585 0.1150 248);
    --palette-informative-700: oklch(0.665 0.1127 248);
    --palette-informative-800: oklch(0.745 0.1058 248);
    --palette-informative-900: oklch(0.845 0.0897 248);
    --palette-informative-1000: oklch(0.935 0.0690 248);

    --surface-shadow: none;
    --surface-stroke: var(--palette-neutral-200);
  }
}

[data-theme="dark"] {
  color-scheme: dark;

  --palette-neutral-00: oklch(0.155 0.0037 57);
  --palette-neutral-100: oklch(0.205 0.0037 57);
  --palette-neutral-200: oklch(0.265 0.0043 57);
  --palette-neutral-300: oklch(0.320 0.0045 57);
  --palette-neutral-400: oklch(0.400 0.0047 57);
  --palette-neutral-500: oklch(0.480 0.0050 57);
  --palette-neutral-600: oklch(0.585 0.0050 57);
  --palette-neutral-700: oklch(0.665 0.0050 57);
  --palette-neutral-800: oklch(0.745 0.0050 57);
  --palette-neutral-900: oklch(0.845 0.0053 57);
  --palette-neutral-1000: oklch(0.935 0.0055 57);

  --palette-brand-00: oklch(0.155 0.0058 57);
  --palette-brand-100: oklch(0.205 0.0128 57);
  --palette-brand-200: oklch(0.265 0.0220 57);
  --palette-brand-300: oklch(0.320 0.0336 57);
  --palette-brand-400: oklch(0.400 0.0452 57);
  --palette-brand-500: oklch(0.480 0.0545 57);
  --palette-brand-600: oklch(0.585 0.0580 57);
  --palette-brand-700: oklch(0.665 0.0568 57);
  --palette-brand-800: oklch(0.745 0.0534 57);
  --palette-brand-900: oklch(0.845 0.0452 57);
  --palette-brand-1000: oklch(0.935 0.0348 57);

  --palette-positive-00: oklch(0.155 0.0115 152);
  --palette-positive-100: oklch(0.205 0.0253 152);
  --palette-positive-200: oklch(0.265 0.0437 152);
  --palette-positive-300: oklch(0.320 0.0667 152);
  --palette-positive-400: oklch(0.400 0.0897 152);
  --palette-positive-500: oklch(0.480 0.1081 152);
  --palette-positive-600: oklch(0.585 0.1150 152);
  --palette-positive-700: oklch(0.665 0.1127 152);
  --palette-positive-800: oklch(0.745 0.1058 152);
  --palette-positive-900: oklch(0.845 0.0897 152);
  --palette-positive-1000: oklch(0.935 0.0690 152);

  --palette-warning-00: oklch(0.155 0.0160 88);
  --palette-warning-100: oklch(0.205 0.0352 88);
  --palette-warning-200: oklch(0.265 0.0608 88);
  --palette-warning-300: oklch(0.320 0.0928 88);
  --palette-warning-400: oklch(0.400 0.1248 88);
  --palette-warning-500: oklch(0.480 0.1504 88);
  --palette-warning-600: oklch(0.585 0.1600 88);
  --palette-warning-700: oklch(0.665 0.1568 88);
  --palette-warning-800: oklch(0.745 0.1472 88);
  --palette-warning-900: oklch(0.845 0.1248 88);
  --palette-warning-1000: oklch(0.935 0.0960 88);

  --palette-critical-00: oklch(0.155 0.0145 27);
  --palette-critical-100: oklch(0.205 0.0319 27);
  --palette-critical-200: oklch(0.265 0.0551 27);
  --palette-critical-300: oklch(0.320 0.0841 27);
  --palette-critical-400: oklch(0.400 0.1131 27);
  --palette-critical-500: oklch(0.480 0.1363 27);
  --palette-critical-600: oklch(0.585 0.1450 27);
  --palette-critical-700: oklch(0.665 0.1421 27);
  --palette-critical-800: oklch(0.745 0.1334 27);
  --palette-critical-900: oklch(0.845 0.1131 27);
  --palette-critical-1000: oklch(0.935 0.0870 27);

  --palette-informative-00: oklch(0.155 0.0115 248);
  --palette-informative-100: oklch(0.205 0.0253 248);
  --palette-informative-200: oklch(0.265 0.0437 248);
  --palette-informative-300: oklch(0.320 0.0667 248);
  --palette-informative-400: oklch(0.400 0.0897 248);
  --palette-informative-500: oklch(0.480 0.1081 248);
  --palette-informative-600: oklch(0.585 0.1150 248);
  --palette-informative-700: oklch(0.665 0.1127 248);
  --palette-informative-800: oklch(0.745 0.1058 248);
  --palette-informative-900: oklch(0.845 0.0897 248);
  --palette-informative-1000: oklch(0.935 0.0690 248);

  --surface-shadow: none;
  --surface-stroke: var(--palette-neutral-200);
}
```

### 8.3 역할 토큰과 모션

한 번만 쓴다. 팔레트를 가리키기만 하므로 다크에서 다시 쓸 것이 없다.

```css
:root {
  --role-bg-neutral: var(--palette-neutral-00);
  --role-bg-neutral-weak: var(--palette-neutral-100);
  --role-bg-neutral-weak-pressed: var(--palette-neutral-200);
  --role-bg-neutral-solid: var(--palette-neutral-1000);
  --role-bg-neutral-disabled: var(--palette-neutral-100);
  --role-bg-brand-solid: var(--palette-brand-800);
  --role-bg-brand-solid-pressed: var(--palette-brand-900);
  --role-bg-brand-weak: var(--palette-brand-100);
  --role-bg-brand-weak-pressed: var(--palette-brand-200);
  --role-bg-brand-weak-selected: var(--palette-brand-100);
  --role-bg-positive-weak: var(--palette-positive-100);
  --role-bg-warning-weak: var(--palette-warning-100);
  --role-bg-critical-solid: var(--palette-critical-800);
  --role-bg-critical-solid-pressed: var(--palette-critical-900);
  --role-bg-critical-weak: var(--palette-critical-100);
  --role-bg-informative-weak: var(--palette-informative-100);

  --role-fg-neutral: var(--palette-neutral-1000);
  --role-fg-neutral-muted: var(--palette-neutral-800);
  --role-fg-neutral-subtle: var(--palette-neutral-700);
  --role-fg-neutral-contrast: var(--palette-neutral-00);
  --role-fg-neutral-disabled: var(--palette-neutral-700);
  --role-fg-brand: var(--palette-brand-800);
  --role-fg-brand-contrast: var(--palette-neutral-00);
  --role-fg-positive: var(--palette-positive-800);
  --role-fg-critical: var(--palette-critical-800);
  --role-fg-informative: var(--palette-informative-800);

  --role-stroke-neutral: var(--palette-neutral-200);
  --role-stroke-neutral-muted: var(--palette-neutral-300);
  --role-stroke-neutral-disabled: var(--palette-neutral-200);
  --role-stroke-brand-solid: var(--palette-brand-800);
  --role-stroke-surface: var(--surface-stroke);

  --duration-fast: 125ms;
  --duration-base: 180ms;
  --duration-slow: 240ms;
  --duration-slower: 300ms;
}
```

### 8.4 테마

```css
@theme {
  --text-xs: 0.8125rem;
  --text-xs--line-height: 1.21875rem;
  --text-sm: 0.9375rem;
  --text-sm--line-height: 1.40625rem;
  --text-base: 1.0625rem;
  --text-base--line-height: 1.59375rem;
  --text-lg: 1.25rem;
  --text-lg--line-height: 1.8125rem;
  --text-xl: 1.375rem;
  --text-xl--line-height: 1.9375rem;
  --text-2xl: 1.625rem;
  --text-2xl--line-height: 2.1875rem;
  --text-3xl: 1.875rem;
  --text-3xl--line-height: 2.5rem;
  --text-4xl: initial;
  --text-5xl: initial;
  --text-6xl: initial;
  --text-7xl: initial;
  --text-8xl: initial;
  --text-9xl: initial;

  --font-weight-thin: initial;
  --font-weight-extralight: initial;
  --font-weight-light: initial;
  --font-weight-extrabold: initial;
  --font-weight-black: initial;

  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: initial;
  --radius-3xl: initial;
  --radius-4xl: initial;
}

@theme inline {
  --color-*: initial;
  --color-transparent: transparent;
  --color-current: currentColor;

  --font-sans: "Wanted Sans Variable", -apple-system, BlinkMacSystemFont,
    system-ui, "Apple SD Gothic Neo", sans-serif;

  --shadow-card: var(--surface-shadow);

  --color-neutral-00: var(--palette-neutral-00);
  --color-neutral-100: var(--palette-neutral-100);
  --color-neutral-200: var(--palette-neutral-200);
  --color-neutral-300: var(--palette-neutral-300);
  --color-neutral-400: var(--palette-neutral-400);
  --color-neutral-500: var(--palette-neutral-500);
  --color-neutral-600: var(--palette-neutral-600);
  --color-neutral-700: var(--palette-neutral-700);
  --color-neutral-800: var(--palette-neutral-800);
  --color-neutral-900: var(--palette-neutral-900);
  --color-neutral-1000: var(--palette-neutral-1000);

  --color-brand-00: var(--palette-brand-00);
  --color-brand-100: var(--palette-brand-100);
  --color-brand-200: var(--palette-brand-200);
  --color-brand-300: var(--palette-brand-300);
  --color-brand-400: var(--palette-brand-400);
  --color-brand-500: var(--palette-brand-500);
  --color-brand-600: var(--palette-brand-600);
  --color-brand-700: var(--palette-brand-700);
  --color-brand-800: var(--palette-brand-800);
  --color-brand-900: var(--palette-brand-900);
  --color-brand-1000: var(--palette-brand-1000);

  --color-positive-00: var(--palette-positive-00);
  --color-positive-100: var(--palette-positive-100);
  --color-positive-200: var(--palette-positive-200);
  --color-positive-300: var(--palette-positive-300);
  --color-positive-400: var(--palette-positive-400);
  --color-positive-500: var(--palette-positive-500);
  --color-positive-600: var(--palette-positive-600);
  --color-positive-700: var(--palette-positive-700);
  --color-positive-800: var(--palette-positive-800);
  --color-positive-900: var(--palette-positive-900);
  --color-positive-1000: var(--palette-positive-1000);

  --color-warning-00: var(--palette-warning-00);
  --color-warning-100: var(--palette-warning-100);
  --color-warning-200: var(--palette-warning-200);
  --color-warning-300: var(--palette-warning-300);
  --color-warning-400: var(--palette-warning-400);
  --color-warning-500: var(--palette-warning-500);
  --color-warning-600: var(--palette-warning-600);
  --color-warning-700: var(--palette-warning-700);
  --color-warning-800: var(--palette-warning-800);
  --color-warning-900: var(--palette-warning-900);
  --color-warning-1000: var(--palette-warning-1000);

  --color-critical-00: var(--palette-critical-00);
  --color-critical-100: var(--palette-critical-100);
  --color-critical-200: var(--palette-critical-200);
  --color-critical-300: var(--palette-critical-300);
  --color-critical-400: var(--palette-critical-400);
  --color-critical-500: var(--palette-critical-500);
  --color-critical-600: var(--palette-critical-600);
  --color-critical-700: var(--palette-critical-700);
  --color-critical-800: var(--palette-critical-800);
  --color-critical-900: var(--palette-critical-900);
  --color-critical-1000: var(--palette-critical-1000);

  --color-informative-00: var(--palette-informative-00);
  --color-informative-100: var(--palette-informative-100);
  --color-informative-200: var(--palette-informative-200);
  --color-informative-300: var(--palette-informative-300);
  --color-informative-400: var(--palette-informative-400);
  --color-informative-500: var(--palette-informative-500);
  --color-informative-600: var(--palette-informative-600);
  --color-informative-700: var(--palette-informative-700);
  --color-informative-800: var(--palette-informative-800);
  --color-informative-900: var(--palette-informative-900);
  --color-informative-1000: var(--palette-informative-1000);

  --color-bg-neutral: var(--role-bg-neutral);
  --color-bg-neutral-weak: var(--role-bg-neutral-weak);
  --color-bg-neutral-weak-pressed: var(--role-bg-neutral-weak-pressed);
  --color-bg-neutral-solid: var(--role-bg-neutral-solid);
  --color-bg-neutral-disabled: var(--role-bg-neutral-disabled);
  --color-bg-brand-solid: var(--role-bg-brand-solid);
  --color-bg-brand-solid-pressed: var(--role-bg-brand-solid-pressed);
  --color-bg-brand-weak: var(--role-bg-brand-weak);
  --color-bg-brand-weak-pressed: var(--role-bg-brand-weak-pressed);
  --color-bg-brand-weak-selected: var(--role-bg-brand-weak-selected);
  --color-bg-positive-weak: var(--role-bg-positive-weak);
  --color-bg-warning-weak: var(--role-bg-warning-weak);
  --color-bg-critical-solid: var(--role-bg-critical-solid);
  --color-bg-critical-solid-pressed: var(--role-bg-critical-solid-pressed);
  --color-bg-critical-weak: var(--role-bg-critical-weak);
  --color-bg-informative-weak: var(--role-bg-informative-weak);

  --color-fg-neutral: var(--role-fg-neutral);
  --color-fg-neutral-muted: var(--role-fg-neutral-muted);
  --color-fg-neutral-subtle: var(--role-fg-neutral-subtle);
  --color-fg-neutral-contrast: var(--role-fg-neutral-contrast);
  --color-fg-neutral-disabled: var(--role-fg-neutral-disabled);
  --color-fg-brand: var(--role-fg-brand);
  --color-fg-brand-contrast: var(--role-fg-brand-contrast);
  --color-fg-positive: var(--role-fg-positive);
  --color-fg-critical: var(--role-fg-critical);
  --color-fg-informative: var(--role-fg-informative);

  --color-stroke-neutral: var(--role-stroke-neutral);
  --color-stroke-neutral-muted: var(--role-stroke-neutral-muted);
  --color-stroke-neutral-disabled: var(--role-stroke-neutral-disabled);
  --color-stroke-brand-solid: var(--role-stroke-brand-solid);
  --color-stroke-surface: var(--role-stroke-surface);
}
```

`--color-*: initial`은 Tailwind가 들고 오는 기본 팔레트를 지운다. 지우지 않으면 `bg-red-500`이 그대로 먹혀서 우리 팔레트 밖 색이 화면에 섞인다. `bg-white`와 `text-black`도 같이 사라지니 흰 면은 `bg-bg-neutral`을 쓴다.

`bg-bg-neutral`처럼 접두사가 겹쳐 보이는 것은 알고 둔 것이다. 역할 토큰 이름이 `bg.neutral`이고 Tailwind 유틸 접두사도 `bg-`라서다. 이름을 하나로 유지해야 위의 표에서 찾은 것을 그대로 옮겨 적을 수 있다.

### 8.5 shadcn 다리

shadcn/ui가 만들어내는 컴포넌트는 `bg-primary`, `text-muted-foreground`, `border-border` 같은 자기 이름을 쓴다. 이 이름들을 우리 역할 토큰에 연결해두면 컴포넌트를 설치한 그 순간부터 우리 색으로 나온다. 연결을 안 하면 shadcn 기본 색이 그대로 남는다.

아래는 결정된 역할 토큰에서 기계적으로 끌어낸 것이다. 새로 정한 색은 없다.

| shadcn 이름 | 우리 역할 토큰 |
| --- | --- |
| `background` | `bg.neutral` |
| `foreground` | `fg.neutral` |
| `card` | `bg.neutral` |
| `card-foreground` | `fg.neutral` |
| `popover` | `bg.neutral` |
| `popover-foreground` | `fg.neutral` |
| `primary` | `bg.brand-solid` |
| `primary-foreground` | `fg.brand-contrast` |
| `secondary` | `bg.neutral-weak` |
| `secondary-foreground` | `fg.neutral` |
| `muted` | `bg.neutral-weak` |
| `muted-foreground` | `fg.neutral-muted` |
| `accent` | `bg.brand-weak` |
| `accent-foreground` | `fg.brand` |
| `destructive` | `bg.critical-solid` |
| `destructive-foreground` | `fg.brand-contrast` |
| `border` | `stroke.neutral` |
| `input` | `stroke.neutral` |
| `ring` | `stroke.brand-solid` |

```css
@theme inline {
  --color-background: var(--role-bg-neutral);
  --color-foreground: var(--role-fg-neutral);
  --color-card: var(--role-bg-neutral);
  --color-card-foreground: var(--role-fg-neutral);
  --color-popover: var(--role-bg-neutral);
  --color-popover-foreground: var(--role-fg-neutral);
  --color-primary: var(--role-bg-brand-solid);
  --color-primary-foreground: var(--role-fg-brand-contrast);
  --color-secondary: var(--role-bg-neutral-weak);
  --color-secondary-foreground: var(--role-fg-neutral);
  --color-muted: var(--role-bg-neutral-weak);
  --color-muted-foreground: var(--role-fg-neutral-muted);
  --color-accent: var(--role-bg-brand-weak);
  --color-accent-foreground: var(--role-fg-brand);
  --color-destructive: var(--role-bg-critical-solid);
  --color-destructive-foreground: var(--role-fg-brand-contrast);
  --color-border: var(--role-stroke-neutral);
  --color-input: var(--role-stroke-neutral);
  --color-ring: var(--role-stroke-brand-solid);
}
```

`accent`가 `bg.brand-weak`로 간 것은 확인이 필요한 자리다. shadcn은 accent를 메뉴 hover 배경에 쓰는데, 그러면 드롭다운을 훑는 동안 브랜드 색이 계속 깜빡인다. [foundation/color.md](foundation/color.md#브랜드-색을-아끼는-이유)의 절제 규칙과 부딪히므로 실제 화면을 보고 `bg.neutral-weak`로 내릴지 판단한다.

### 8.6 베이스

body가 배경색과 글자색을 명시로 받는다.

```css
@layer base {
  body {
    background-color: var(--role-bg-neutral);
    color: var(--role-fg-neutral);
  }
}
```

`color-scheme: dark`만으로도 브라우저가 알아서 어두운 바탕을 깔지만 그 색은 브라우저마다 다르고 우리 `neutral-00`이 아니다. 화면 전체의 바탕이 팔레트 밖 색이면 그 위에 올린 면과 미세하게 어긋난다. `@layer base`에 두었으니 유틸리티가 언제나 이긴다.

---

## 출처

역할 토큰의 이름 체계 — `Property.Role-Variant-State` 문법, `00`부터 `1000`까지의 단계 명명, 팔레트와 역할의 2계층 구조 — 는 당근 [Seed Design](https://seed-design.io)에서 가져왔다. Seed Design은 Apache License 2.0으로 공개돼 있다.

가져온 것은 이름 체계다. 색값은 우리가 OKLCH로 따로 계산했고 Seed의 값을 옮겨 적지 않았다.

```
Copyright Danggeun Market Inc.
Licensed under the Apache License, Version 2.0
https://www.apache.org/licenses/LICENSE-2.0
```

타이포그래피 스케일과 문안 규칙은 토스 TDS의 [Consumer UX Guide](https://developers-apps-in-toss.toss.im/design/consumer-ux-guide)를 참고했다.

Wanted Sans는 Wanted Lab이 만들었고 [SIL Open Font License 1.1](https://scripts.sil.org/OFL)로 배포된다.

---

## 아직 안 정한 것

임의로 채우지 않는다. 사람이 정하고 나서 이 절에서 빼고 위로 올린다.

### 정해야 할 것

**브랜드 색 출처.** 지금 brand 계열은 2026 리뉴얼 홀 이미지와 lbwedding.co.kr 내비게이션에서 뽑았다. 공식 브랜드 가이드로 확인한 값이 아니다. 로고나 명함, 인쇄물에 정해진 색이 있으면 hue를 그쪽으로 옮기고 brand 계열 열한 단계를 다시 뽑는다. neutral도 같은 hue를 쓰므로 같이 움직인다.

**테마를 고르는 UI와 그 선택을 어디 저장할지.** 기기 설정을 따르되 앱에서 덮을 수 있게 하기로 정했고 CSS는 `[data-theme]` 양쪽 갈래를 다 받는다. 하지만 그 속성을 실제로 걸어줄 화면이 없다. 설정 화면 어디에 둘지, 선택을 localStorage에 둘지 계정에 둘지, 첫 페인트 전에 어떻게 복원할지가 안 정해졌다.

**되돌리기 어려운 동작에 별도 색을 줄지.** 출근 인증은 한 번 찍으면 되돌리는 길이 없고([domain/attendance.md](../domain/attendance.md)) 교대 수락도 그렇다. 둘 다 지금은 같은 `bg.brand-solid`라서 한 화면에 브랜드 버튼이 둘 뜰 수 있다. 그러면 어느 쪽이 주요 액션인지 흐려진다.

**빈 상태 화면.** 근무 없는 날, 급여 0원, 알림 0건을 이 팔레트로 아직 안 그려봤다. 뉴트럴만으로 충분히 읽히는지, 일러스트가 필요한지 모른다.

### 전개하면서 드러난 빈자리

**축하 모션을 쓸 자리.** [foundation/motion.md](foundation/motion.md#축하할-순간)에 적었듯 출근 인증 완료 하나는 확실한데, 두 번째로 지목됐던 "급여 확정"은 도메인에 없는 행위다. `docs/domain/payroll.md`가 급여를 확정하지 않는다고 못 박아뒀다.
