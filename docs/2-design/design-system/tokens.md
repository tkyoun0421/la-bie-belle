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

계열 일곱, 단계 열하나다. CSS에는 oklch를 넣는다. hex는 값을 눈으로 확인하고 시안을 그릴 때 쓰는 참고치다.

명도 곡선은 일곱 계열이 공유한다.

| | 00 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 라이트 L | 1 | 0.965 | 0.905 | 0.845 | 0.76 | 0.68 | 0.625 | 0.545 | 0.455 | 0.32 | 0.215 |
| 다크 L | 0.155 | 0.205 | 0.265 | 0.32 | 0.4 | 0.48 | 0.585 | 0.665 | 0.745 | 0.845 | 0.935 |

### neutral

hue 250, chroma 최대 0.008.

| 단계 | 라이트 hex | 라이트 oklch | 다크 hex | 다크 oklch |
| --- | --- | --- | --- | --- |
| 00 | `#FFFFFF` | `oklch(1.000 0.0001 250)` | `#0C0C0C` | `oklch(0.155 0.0008 250)` |
| 100 | `#F2F3F4` | `oklch(0.965 0.0018 250)` | `#171718` | `oklch(0.205 0.0018 250)` |
| 200 | `#DEE0E1` | `oklch(0.905 0.0030 250)` | `#242527` | `oklch(0.265 0.0030 250)` |
| 300 | `#CACCCF` | `oklch(0.845 0.0046 250)` | `#313335` | `oklch(0.320 0.0046 250)` |
| 400 | `#AEB1B5` | `oklch(0.760 0.0062 250)` | `#45484B` | `oklch(0.400 0.0062 250)` |
| 500 | `#95999D` | `oklch(0.680 0.0075 250)` | `#5A5E62` | `oklch(0.480 0.0075 250)` |
| 600 | `#84888C` | `oklch(0.625 0.0080 250)` | `#787C80` | `oklch(0.585 0.0080 250)` |
| 700 | `#6D7175` | `oklch(0.545 0.0078 250)` | `#909498` | `oklch(0.665 0.0078 250)` |
| 800 | `#54575B` | `oklch(0.455 0.0074 250)` | `#A9ADB1` | `oklch(0.745 0.0074 250)` |
| 900 | `#303336` | `oklch(0.320 0.0062 250)` | `#C9CCD0` | `oklch(0.845 0.0062 250)` |
| 1000 | `#181A1C` | `oklch(0.215 0.0048 250)` | `#E7EAED` | `oklch(0.935 0.0048 250)` |


### brand

hue 266, chroma 최대 0.24.

| 단계 | 라이트 hex | 라이트 oklch | 다크 hex | 다크 oklch |
| --- | --- | --- | --- | --- |
| 00 | `#FFFFFF` | `oklch(1.000 0.0001 266)` | `#080C16` | `oklch(0.155 0.0240 266)` |
| 100 | `#EEF4FF` | `oklch(0.965 0.0160 266)` | `#0C152F` | `oklch(0.205 0.0530 266)` |
| 200 | `#D2E0FE` | `oklch(0.905 0.0443 266)` | `#102151` | `oklch(0.265 0.0910 266)` |
| 300 | `#B6CCFE` | `oklch(0.845 0.0740 266)` | `#112878` | `oklch(0.320 0.1390 266)` |
| 400 | `#8EAFFD` | `oklch(0.760 0.1185 266)` | `#1836AA` | `oklch(0.400 0.1870 266)` |
| 500 | `#6992FC` | `oklch(0.680 0.1630 266)` | `#2248DA` | `oklch(0.480 0.2256 266)` |
| 600 | `#507DFC` | `oklch(0.625 0.1951 266)` | `#3E6CFB` | `oklch(0.585 0.2192 266)` |
| 700 | `#2F5CF6` | `oklch(0.545 0.2350 266)` | `#628DFC` | `oklch(0.665 0.1716 266)` |
| 800 | `#1D40CF` | `oklch(0.455 0.2210 266)` | `#87AAFD` | `oklch(0.745 0.1266 266)` |
| 900 | `#0A1990` | `oklch(0.320 0.1870 266)` | `#B6CCFE` | `oklch(0.845 0.0740 266)` |
| 1000 | `#03015A` | `oklch(0.215 0.1440 266)` | `#E0EAFE` | `oklch(0.935 0.0300 266)` |

### sky

hue 250, chroma 최대 0.16.

| 단계 | 라이트 hex | 라이트 oklch | 다크 hex | 다크 oklch |
| --- | --- | --- | --- | --- |
| 00 | `#FFFFFF` | `oklch(1.000 0.0001 250)` | `#070D13` | `oklch(0.155 0.0160 250)` |
| 100 | `#EBF5FF` | `oklch(0.965 0.0168 250)` | `#0A1827` | `oklch(0.205 0.0354 250)` |
| 200 | `#C9E3FE` | `oklch(0.905 0.0465 250)` | `#0A2741` | `oklch(0.265 0.0606 250)` |
| 300 | `#A6D1FE` | `oklch(0.845 0.0776 250)` | `#01345E` | `oklch(0.320 0.0896 250)` |
| 400 | `#71B6FD` | `oklch(0.760 0.1241 250)` | `#034980` | `oklch(0.400 0.1109 250)` |
| 500 | `#449DF1` | `oklch(0.680 0.1504 250)` | `#0760A4` | `oklch(0.480 0.1325 250)` |
| 600 | `#268BE3` | `oklch(0.625 0.1600 250)` | `#117FD6` | `oklch(0.585 0.1600 250)` |
| 700 | `#0B73C3` | `oklch(0.545 0.1502 250)` | `#3998EF` | `oklch(0.665 0.1566 250)` |
| 800 | `#065999` | `oklch(0.455 0.1258 250)` | `#66B2FD` | `oklch(0.745 0.1326 250)` |
| 900 | `#01345E` | `oklch(0.320 0.0896 250)` | `#A6D1FE` | `oklch(0.845 0.0776 250)` |
| 1000 | `#001A35` | `oklch(0.215 0.0628 250)` | `#DAECFE` | `oklch(0.935 0.0315 250)` |

### mint

hue 183, chroma 최대 0.15.

| 단계 | 라이트 hex | 라이트 oklch | 다크 hex | 다크 oklch |
| --- | --- | --- | --- | --- |
| 00 | `#FFFFFF` | `oklch(1.000 0.0002 183)` | `#050E0D` | `oklch(0.155 0.0150 183)` |
| 100 | `#DCFBF5` | `oklch(0.965 0.0331 183)` | `#021C19` | `oklch(0.205 0.0331 183)` |
| 200 | `#B6EDE3` | `oklch(0.905 0.0568 183)` | `#002C27` | `oklch(0.265 0.0471 183)` |
| 300 | `#88DFD1` | `oklch(0.845 0.0868 183)` | `#013C35` | `oklch(0.320 0.0562 183)` |
| 400 | `#44C9B8` | `oklch(0.760 0.1168 183)` | `#04544B` | `oklch(0.400 0.0697 183)` |
| 500 | `#17AF9F` | `oklch(0.680 0.1177 183)` | `#096D62` | `oklch(0.480 0.0833 183)` |
| 600 | `#139D8E` | `oklch(0.625 0.1082 183)` | `#108F81` | `oklch(0.585 0.1013 183)` |
| 700 | `#0D8275` | `oklch(0.545 0.0945 183)` | `#16AA9A` | `oklch(0.665 0.1151 183)` |
| 800 | `#07655B` | `oklch(0.455 0.0790 183)` | `#1BC6B4` | `oklch(0.745 0.1289 183)` |
| 900 | `#013C35` | `oklch(0.320 0.0562 183)` | `#64E5D3` | `oklch(0.845 0.1168 183)` |
| 1000 | `#001F1B` | `oklch(0.215 0.0391 183)` | `#A2FEEF` | `oklch(0.935 0.0900 183)` |


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


**hue를 회색까지 같은 쪽에 뒀다.** `neutral`이 250, `brand`가 266, `sky`가 250이다. 브랜드가 파랑이 되면서 따뜻한 회색이 그 아래에서 누렇게 떠서, 바탕도 차가운 쪽으로 옮겼다.

**`sky`와 `mint`가 그림의 둘째·셋째 몫이다.** 앞서 있던 `chart-a`·`chart-b`·`chart-c`를 대신한다. 그 셋은 chroma가 0.065에 묶여 있었는데, 그것은 브랜드가 0.058짜리 흐린 브라운이라 「차트가 브랜드보다 진하면 안 된다」고 잡은 선이었다. 브랜드가 0.24가 되면서 그 전제가 사라졌다.

**`informative`도 `sky`가 대신한다.** hue 248이라 브랜드 266과 18도 차이여서, 안내 면과 주요 버튼이 한 화면에 서면 같은 것으로 읽혔다. 근거는 [ADR-012](../adr/ADR-012-blue-brand-and-looser-density.md)에 있다.

**positive·warning·critical의 hue를 그림에 안 빌린다.** 그 셋은 좋고 나쁨을 말하는 색이라 숫자에 평가가 실린다. 근거는 [foundation/color.md](foundation/color.md#차트가-색을-쓰는-법)에 있다.

---

## 2. 역할 토큰

이름은 `Property.Role-Variant-State`다. Property 셋(`fg` `bg` `stroke`), Role 일곱(neutral brand sky mint positive warning critical), Variant는 solid·weak·muted·subtle·contrast, State는 pressed·selected·disabled.


문법의 뜻은 [foundation/color.md](foundation/color.md#variant와-state)에 있다.

**팔레트 열은 한 벌뿐이다.** 라이트와 다크가 같은 단계를 가리키고 팔레트가 알아서 뒤집힌다.

**팔레트 칸이 `—`인 행은 그 규칙 밖이다.** 뒤집히면 안 되는 값이나 팔레트에 없는 값을 쓰는 자리다. 이 행들은 라이트·다크 칸이 곧 값이고, 칸에는 둘 중 하나가 온다 — 색 리터럴(`#`으로 시작하거나 `transparent`)이거나 팔레트 단계 이름(`neutral-200`)이다. 단계 이름이 오면 그 팔레트 변수를 가리키고, 리터럴이 오면 그대로 박힌다. 라이트와 다크가 서로 다른 종류여도 된다.

### bg

| 토큰 | 팔레트 | 라이트 | 다크 | Tailwind 유틸 |
| --- | --- | --- | --- | --- |
| `bg.neutral` | neutral-00 | `#FFFFFF` | `#0C0C0C` | `bg-bg-neutral` |
| `bg.neutral-weak` | neutral-100 | `#F2F3F4` | `#171718` | `bg-bg-neutral-weak` |
| `bg.neutral-weak-pressed` | neutral-200 | `#DEE0E1` | `#242527` | `bg-bg-neutral-weak-pressed` |
| `bg.neutral-solid` | neutral-1000 | `#181A1C` | `#E7EAED` | `bg-bg-neutral-solid` |
| `bg.neutral-solid-soft` | neutral-900 | `#303336` | `#C9CCD0` | `bg-bg-neutral-solid-soft` |
| `bg.neutral-disabled` | neutral-100 | `#F2F3F4` | `#171718` | `bg-bg-neutral-disabled` |
| `bg.neutral-muted` | neutral-400 | `#AEB1B5` | `#45484B` | `bg-bg-neutral-muted` |
| `bg.brand-solid` | brand-700 | `#2F5CF6` | `#628DFC` | `bg-bg-brand-solid` |
| `bg.brand-solid-pressed` | brand-800 | `#1D40CF` | `#87AAFD` | `bg-bg-brand-solid-pressed` |
| `bg.brand-weak` | brand-100 | `#EEF4FF` | `#0C152F` | `bg-bg-brand-weak` |
| `bg.brand-weak-pressed` | brand-200 | `#D2E0FE` | `#102151` | `bg-bg-brand-weak-pressed` |
| `bg.brand-weak-selected` | brand-100 | `#EEF4FF` | `#0C152F` | `bg-bg-brand-weak-selected` |
| `bg.brand-muted` | brand-300 | `#B6CCFE` | `#112878` | `bg-bg-brand-muted` |
| `bg.sky` | sky-600 | `#268BE3` | `#117FD6` | `bg-bg-sky` |
| `bg.sky-weak` | sky-100 | `#EBF5FF` | `#0A1827` | `bg-bg-sky-weak` |
| `bg.mint` | mint-600 | `#139D8E` | `#108F81` | `bg-bg-mint` |
| `bg.mint-weak` | mint-100 | `#DCFBF5` | `#021C19` | `bg-bg-mint-weak` |
| `bg.positive-weak` | positive-100 | `#E8F9EB` | `#0E1B11` | `bg-bg-positive-weak` |
| `bg.warning-weak` | warning-100 | `#FDF3D9` | `#1E1603` | `bg-bg-warning-weak` |
| `bg.critical-solid` | critical-800 | `#93302B` | `#F5897E` | `bg-bg-critical-solid` |
| `bg.critical-solid-pressed` | critical-900 | `#60100F` | `#FFAFA4` | `bg-bg-critical-solid-pressed` |
| `bg.critical-weak` | critical-100 | `#FFECE8` | `#24110F` | `bg-bg-critical-weak` |
| `bg.scrim` | — | `#181A1C6B` | `#0C0C0C6B` | `bg-bg-scrim` |

`bg.brand-solid`가 `brand-700`이다. 다른 계열이 `-800`을 꽉 찬 면으로 쓰는 것과 갈리는데, 파랑은 `-800`(`#1D40CF`)이 남색에 가까워져 레퍼런스에서 받은 색과 멀어진다. `-700`이 그 색이고 흰 글자 대비도 5.27로 선다. 눌린 상태가 `-800`을 받아 한 단계씩 밀렸다.

`bg.neutral-muted`는 그림에서 값이 작거나 강조할 것이 아닌 몫을 칠하는 면이다. 막대와 띠가 쓴다 — 근거는 [foundation/color.md](foundation/color.md#차트가-색을-쓰는-법)에 있다.

`bg.brand-muted`는 옅은 브랜드 면이 중립 면 위에 떠야 하는 자리를 위한 것이다. `bg.brand-weak`는 `brand-100`이라 라이트에서 명도 0.965인데 `bg.neutral-weak`도 0.965다 — 겹쳐 놓으면 두 면이 갈리지 않는다. `brand-300`은 0.845로 0.120이 갈린다.

`bg.scrim`은 팔레트를 안 따른다. 덮개는 뒤를 어둡게 하는 것이 일이라 명도가 뒤집히면 안 되는 몇 안 되는 자리인데, 팔레트가 적응형이라 `bg.neutral-solid`를 쓰면 다크에서 밝은 회색이 되어 화면을 흰 막이 덮는다. 그래서 라이트는 `neutral-1000`, 다크는 `neutral-00`을 값으로 굳혔다 — 양쪽 다 어두운 잉크다. 투명도 42%가 값에 들어 있어 쓰는 쪽이 따로 안 얹는다.

### fg

| 토큰 | 팔레트 | 라이트 | 다크 | Tailwind 유틸 |
| --- | --- | --- | --- | --- |
| `fg.neutral` | neutral-1000 | `#181A1C` | `#E7EAED` | `text-fg-neutral` |
| `fg.neutral-muted` | neutral-800 | `#54575B` | `#A9ADB1` | `text-fg-neutral-muted` |
| `fg.neutral-subtle` | neutral-700 | `#6D7175` | `#909498` | `text-fg-neutral-subtle` |
| `fg.neutral-contrast` | neutral-00 | `#FFFFFF` | `#0C0C0C` | `text-fg-neutral-contrast` |
| `fg.neutral-disabled` | neutral-800 | `#54575B` | `#A9ADB1` | `text-fg-neutral-disabled` |
| `fg.brand` | brand-700 | `#2F5CF6` | `#628DFC` | `text-fg-brand` |
| `fg.brand-contrast` | neutral-00 | `#FFFFFF` | `#0C0C0C` | `text-fg-brand-contrast` |
| `fg.sky` | sky-800 | `#065999` | `#66B2FD` | `text-fg-sky` |
| `fg.sky-contrast` | sky-400 | `#71B6FD` | `#034980` | `text-fg-sky-contrast` |
| `fg.mint` | mint-800 | `#07655B` | `#1BC6B4` | `text-fg-mint` |
| `fg.positive` | positive-800 | `#1A6738` | `#77C08B` | `text-fg-positive` |
| `fg.critical` | critical-800 | `#93302B` | `#F5897E` | `text-fg-critical` |
| `fg.positive-contrast` | positive-400 | `#85C295` | `#18552E` | `text-fg-positive-contrast` |

`fg.warning`은 없다. 만들지 않은 것이라 나중에 필요해 보여도 더하지 않는다.

**`fg.neutral-disabled`와 `fg.neutral-muted`는 같은 색이다.** 회색이 차가운 쪽으로 옮기며 명도 관계가 미세하게 달라져 neutral-700이 비활성 면 위에서 4.43으로 떨어졌고, neutral-800으로 올리면서 `fg.neutral-muted`와 같은 단계가 됐다(아래 [떨어진 조합](#떨어진-조합)). 그래서 이 둘로는 눈이 갈리지 않는다. 배경과 테두리가 같이 걸리는 버튼에서는 문제가 안 되지만, **글자나 아이콘 하나만 이 색으로 흐리게 해서 「못 누른다」를 말하려는 자리는 안 된다.** 그런 자리는 색을 바꾸지 말고 아예 안 그리고 자리만 남긴다 — 급여 조회와 통계의 못 가는 화살표가 그렇다([payroll.md](../modules/payroll/screens/payroll.md#급여-조회-색), [stats.md](../system/screens/stats.md#통계-색)).

`-contrast`가 붙은 계열색 둘은 반전 면 위에 서는 자리를 위한 것이다. `fg.positive`가 라이트에서 어두운 녹색(`#1A6738`)이라 토스트처럼 어두운 면 위에 올리면 안 보인다. 팔레트가 적응형이라 `-400` 단계가 그 반전을 그대로 해준다 — 라이트에서 밝고 다크에서 어둡다. `fg.critical-contrast`와 `fg.mint-contrast`는 만들지 않았다. 쓰는 자리가 없어서다.

### stroke

| 토큰 | 팔레트 | 라이트 | 다크 | Tailwind 유틸 |
| --- | --- | --- | --- | --- |
| `stroke.neutral` | neutral-200 | `#DEE0E1` | `#242527` | `border-stroke-neutral` |
| `stroke.neutral-muted` | neutral-300 | `#CACCCF` | `#313335` | `border-stroke-neutral-muted` |
| `stroke.neutral-disabled` | neutral-200 | `#DEE0E1` | `#242527` | `border-stroke-neutral-disabled` |
| `stroke.brand-solid` | brand-700 | `#2F5CF6` | `#628DFC` | `border-stroke-brand-solid` |
| `stroke.sky` | sky-600 | `#268BE3` | `#117FD6` | `border-stroke-sky` |
| `stroke.mint` | mint-600 | `#139D8E` | `#108F81` | `border-stroke-mint` |
| `stroke.surface` | — | `transparent` | neutral-200 | `border-stroke-surface` |

`stroke.surface`는 새 색이 아니다. 라이트에서 그림자로 면을 띄우고 다크에서 선으로 나누는 규칙을 클래스 한 벌로 굴리려고 둔 것이라 라이트에서는 투명이고 다크에서 `neutral-200`을 가리킨다. 근거는 [foundation/spacing-shape.md](foundation/spacing-shape.md#그림자와-면-나누기)에 있다. 라이트 칸이 리터럴이고 다크 칸이 팔레트 단계 이름인 행이라 위의 「팔레트 칸이 `—`인 행」 규칙이 처음 쓰인 자리다.

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
| `rounded-sm` | 8px | 배지, 달력 칸 |
| `rounded-md` | 12px | 입력 |
| `rounded-lg` | 14px | 버튼, 세그먼트, 토스트, 작은 카드, 다이얼로그 |
| `rounded-xl` | 20px | 카드 |
| `rounded-full` | 9999px | 원과 트랙 |

`rounded-full`은 원을 그리는 자리에만 남는다 — 사진과 이니셜 원, 안 읽음 점, 시트 손잡이, 하루 띠의 트랙과 채움, 스위치, 그리고 글자 없이 아이콘만 든 정사각형 버튼. 가로세로가 같거나 높이가 몇 픽셀인 조각이라 값이 바뀌면 모양이 깨진다.

누를 수 있는 것은 `rounded-lg`다. 알약을 버린 것은 버튼 높이의 절반이 곡률이라 48px 버튼이 좌우 반원이 되고, 한 화면에 알약이 여럿 서면 전부 둥글게 읽히기 때문이다. 14px은 입력(12px)보다 크고 카드(20px)보다 작아서 「면 → 누를 것 → 적을 것」 위계가 모서리만으로 읽힌다. 배지는 높이가 24px이라 14px을 주면 다시 알약이 돼서 한 단계 아래인 8px이다.

그림자는 셋이다. 면이 화면에서 얼마나 떨어져 있느냐로 갈린다.

| 유틸 | 라이트 | 다크 |
| --- | --- | --- |
| `shadow-card` | `0 1px 2px rgba(28,25,22,.05), 0 8px 20px -14px rgba(28,25,22,.4)` | `none` |
| `shadow-pop` | `0 1px 2px rgba(28,25,22,.05), 0 14px 30px -18px rgba(28,25,22,.5)` | `none` |
| `shadow-sheet` | `0 -1px 0 var(--stroke-neutral), 0 -14px 34px -22px rgba(28,25,22,.5)` | `0 -1px 0 var(--stroke-neutral)` |

`shadow-card`는 화면에 앉은 면이다. `shadow-pop`은 화면 위에 뜬 면 — 더보기 팝오버와 가운데 Dialog — 이라 더 멀리, 더 진하게 진다. `shadow-sheet`는 아래에서 올라온 바텀시트라 위로 진다.

다크에서는 그림자가 사라지고 `border-stroke-surface`가 선을 그린다. 시트만 위쪽 1px 선을 그림자 값 안에 품고 있다 — 시트는 위쪽 한 변만 화면과 닿아서 테두리를 네 변에 두를 이유가 없다. 클래스는 양쪽에서 같다. 근거는 [foundation/spacing-shape.md](foundation/spacing-shape.md#그림자와-면-나누기)에 있다.

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

### 되풀이 주기와 계단

위의 duration 넷은 전부 한 번 일어나고 끝나는 전환의 길이다. 되풀이하는 주기와 요소 사이의 간격은 성격이 달라서 접두어를 나눴다. `--duration-`은 한 번, `--interval-`은 되풀이, `--stagger-`는 요소 사이다.

| 변수 | 값 | 쓰는 자리 |
| --- | --- | --- |
| `--interval-rotate` | 4s | 문구가 저절로 갈리는 주기 |
| `--interval-beat` | 1.8s | 기다리는 중을 알리는 점이 뛰는 주기 |
| `--interval-dash` | 0.55s | 답을 기다리는 자리의 점선이 대시 하나만큼 흐르는 주기 |
| `--stagger-step` | 70ms | 등장할 때 요소끼리 어긋나는 간격 |

Tailwind 유틸이 없다. 넷 다 `var()`로 직접 쓴다.

값을 이렇게 잡은 이유다.

`--interval-rotate`는 한 줄을 읽고 눈을 뗄 시간이다. 더 짧으면 다 읽기 전에 갈리고, 더 길면 갈린다는 것을 눈치채기 전에 화면을 닫는다.

`--interval-beat`는 맥박보다 느리다. 사람의 평상시 맥박이 1초를 밑도는데 그보다 빠르게 뛰면 재촉으로 읽힌다. 승인 대기는 사람이 서두를 수 있는 것이 없는 화면이라 재촉하면 안 된다.

`--interval-dash`가 그보다 훨씬 짧은 것은 한 주기가 옮기는 거리가 다르기 때문이다. 뛰는 점은 한 주기에 점 전체가 커졌다 작아지지만, 흐르는 점선은 한 주기에 대시 하나 길이(3px + 3px)만 움직인다. 같은 1.8초를 주면 초당 3px라 도는 것을 확인하려고 지켜봐야 한다. 0.55초는 초당 11px쯤이고, 눈을 두지 않아도 흐르는 것이 보이면서 재촉으로는 안 읽히는 자리다.

`--stagger-step`은 요소가 따로 움직인다고 읽히는 최소 간격이다. 더 좁히면 한 덩이가 통째로 올라오는 것으로 보여서 계단을 준 값이 사라진다.

넷 다 [foundation/motion.md](foundation/motion.md)의 규칙 안에 있다. 되풀이 주기 셋이 「자주 일어나는 것은 움직이지 않는다」와 부딪히는 자리는 그 화면의 문서가 따로 적는다.

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
| `fg.neutral` on `bg.neutral` | 17.45 | 16.20 |
| `fg.neutral-muted` on `bg.neutral` | 7.26 | 8.66 |
| `fg.neutral-subtle` on `bg.neutral` | 4.92 | 6.40 |
| `fg.brand` on `bg.neutral` | 5.27 | 6.27 |
| `fg.brand-contrast` on `bg.brand-solid` | 5.27 | 6.27 |
| `fg.sky` on `bg.neutral` | 7.25 | 8.71 |
| `fg.mint` on `bg.neutral` | 6.95 | 9.11 |
| `fg.positive` on `bg.neutral` | 6.91 | 9.03 |
| `fg.critical` on `bg.neutral` | 7.78 | 8.16 |
| `fg.neutral-contrast` on `bg.critical-solid` | 7.78 | 8.16 |
| `fg.neutral-disabled` on `bg.neutral-disabled` | 6.54 | 7.93 |
| `fg.neutral` on `bg.neutral-weak` | 15.71 | 14.84 |
| `fg.neutral-muted` on `bg.neutral-weak` | 6.54 | 7.93 |
| `fg.neutral` on `bg.positive-weak` | 15.94 | 14.69 |
| `fg.neutral-muted` on `bg.positive-weak` | 6.63 | 7.86 |
| `fg.positive` on `bg.positive-weak` | 6.31 | 8.19 |
| `fg.neutral` on `bg.sky-weak` | 15.82 | 14.83 |
| `fg.neutral-muted` on `bg.sky-weak` | 6.58 | 7.93 |
| `fg.sky` on `bg.sky-weak` | 6.57 | 7.97 |
| `fg.brand` on `bg.brand-weak` | 4.78 | 5.79 |

**브랜드가 파랑이 되며 여유가 줄었다.** 브라운 주 면에 흰 글자가 7.34였던 자리가 5.27이다. 기준은 넘지만 여기서 더 내리면 떨어진다 — 주 면을 한 단계 밝게 올리자는 안이 나오면 이 줄을 먼저 본다.

비활성 글자도 읽혀야 해서 이 줄을 기준 아래로 내리지 않았다. 버튼이 왜 눌리지 않는지는 대개 그 버튼에 적힌 글자가 알려준다.

옅은 면 위의 조합들은 [pages/login.md](../modules/account/screens/login.md#승인-대기-색)의 알림 영역에서 나왔다. 옅은 면에 글자를 올리는 자리는 알림 블록마다 되풀이되니 다른 화면에도 같은 값이 걸린다.

### 떨어진 조합

| 조합 | 결과 | 판정 |
| --- | --- | --- |
| neutral-600 on `bg.neutral` (라이트) | 3.57 | `fg.neutral-subtle`에서 탈락. neutral-700으로 올렸다 |
| neutral-700 on `bg.neutral-disabled` (라이트) | 4.43 | `fg.neutral-disabled`에서 탈락. neutral-800으로 올렸다 |
| brand-800 vs warning-800 (라이트) | 1.08 | 사실상 같은 밝기. warning을 글자색에서 뺐다 |
| `fg.neutral-contrast` on `bg.sky` (라이트) | 3.57 | 떨어진 채로 둔다 — 아래 규칙을 보라 |
| `fg.neutral-contrast` on `bg.mint` (라이트) | 3.36 | 같다 |

**`bg.sky`와 `bg.mint` 위에는 글자를 안 올린다.** 그림의 둘째·셋째 몫을 칠하는 면이라 그 위에 글자가 설 일이 없다 — 띠도 막대도 도넛 호도 글자를 면 밖에 둔다. 글자를 올려야 하는 자리가 생기면 `-600`이 아니라 `sky-800`·`mint-800` 면을 쓴다. 그 단계에서는 흰 글자가 7.25와 6.95로 선다.

두 판정의 근거는 [foundation/color.md](foundation/color.md#대비-검증)와 [경고색 제약](foundation/color.md#경고색-제약)에 있다.

새 조합을 만들 때는 측정하고 이 표에 줄을 더한다. 눈으로 판정하지 않는다.

`on bg.neutral` 값 여덟이 한때 어긋나 있었다. 일곱은 neutral-00이 아니라 neutral-100 면으로 잰 값이 적혀 있었고 하나는 소수점이 틀렸다. 어느 쪽도 4.5 판정을 뒤집지 않았지만, 손으로 재고 손으로 옮겨 적는 한 같은 일이 또 난다. 이 표를 기계가 대신 재게 하는 것이 남은 일이다.

---

## 8. CSS 전문

`src/app/globals.css`는 이 파일에서 만든다. `pnpm tokens:css`가 앞 절의 표를 읽어 CSS 한 벌을 새로 쓴다. globals.css를 손으로 고치지 않는다. 다음 실행이 덮는다.

앞 절 표에서 나오는 것은 여기 사본을 두지 않는다. 팔레트도 역할 토큰도 타이포 스케일도 라운딩도 그림자도 모션도 바깥 값도 자기 절이 정본이고, 같은 값을 여기 옮겨 적으면 두 곳이 언젠가 어긋난다.

그래서 이 절에 남은 것은 아래 넷뿐이다. 표로 담을 수 없는 뼈대라 이 절이 그것들의 유일한 정본이고, 코드펜스 안을 고치면 다음 생성이 그대로 옮겨 담는다.

블록 선택자와 `color-scheme`은 여기 없다. `:root`와 `@media (prefers-color-scheme: dark)`와 `:root:not([data-theme="light"])`와 `[data-theme="dark"]`는 생성기가 세운다. 면을 띄우는 `--surface-shadow`·`--surface-shadow-pop`·`--surface-shadow-sheet`와 `--surface-stroke`도 없다. 값은 2절과 5절 표에서 온다 — 팔레트 칸이 `—`인 행은 라이트·다크 칸이 곧 값이라 생성기가 따로 아는 값이 없다.

`@theme inline`을 쓰는 이유는 Tailwind 4의 동작 때문이다. 그냥 `@theme`은 값을 `:root`에서 한 번 굳혀버려서, 다크에서 팔레트가 바뀌어도 유틸이 옛 값을 계속 가리킨다. `inline`은 유틸에 `var()`를 그대로 심어 요소 자리에서 값을 풀게 한다.

### 8.1 뼈대

파일 맨 앞에 그대로 놓인다.

`tw-animate-css`는 [motion.md](foundation/motion.md)가 지목하는 등장 유틸(`animate-in`·`fade-in`·`zoom-in-95` 등)의 출처다. import가 없으면 그 유틸이 존재하지 않아 모션 조항을 코드가 지킬 수 없다 — login-screens 검수 1회차가 그 어긋남을 잡았다.

`@custom-variant dark`가 팔레트를 뒤집는 조건을 `dark:` 유틸리티 쪽에도 건다. Tailwind의 기본 `dark:`는 미디어 쿼리만 보기 때문에, 이것이 없으면 팔레트는 `[data-theme="dark"]`를 따라 뒤집히는데 `dark:` 클래스를 단 자리만 라이트로 남는다. 갈래 둘의 조건이 생성기가 세우는 팔레트 블록 둘과 정확히 같아야 한다. `[data-theme="light"]`가 붙어 있으면 기기가 다크여도 라이트로 남는다.

```css
@import "tailwindcss";
@import "tw-animate-css";

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
```

### 8.2 Tailwind 기본값 초기화와 서체

Tailwind가 기본으로 들고 오는 것 중 안 쓰는 것을 지우고 서체를 건다. 값이 아니라 「지운다」는 선언이라 표로 담을 자리가 없다.

펜스 둘이고 순서가 곧 자리다. 첫 펜스는 `@theme` 블록 끝에, 둘째 펜스는 `@theme inline` 블록 머리에 들어간다.

무엇을 왜 지웠는지는 [3절](#3-타이포그래피)과 [5절](#5-라운딩과-그림자)에 있다. 크기는 `text-3xl`까지, 굵기는 넷, 라운딩은 `rounded-xl`까지가 전부다.

```css
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

  --radius-2xl: initial;
  --radius-3xl: initial;
  --radius-4xl: initial;
```

`--color-*: initial`은 Tailwind가 들고 오는 기본 팔레트를 지운다. 지우지 않으면 `bg-red-500`이 그대로 먹혀서 우리 팔레트 밖 색이 화면에 섞인다. `bg-white`와 `text-black`도 같이 사라지니 흰 면은 `bg-bg-neutral`을 쓴다.

`--font-sans`의 첫 자리가 [서체 연결](#서체-연결)의 스타일시트가 선언하는 이름이다. 뒤의 넷은 그 폰트를 못 받았을 때의 대체다.

```css
  --color-*: initial;
  --color-transparent: transparent;
  --color-current: currentColor;

  --font-sans:
    "Wanted Sans Variable", -apple-system, BlinkMacSystemFont, system-ui,
    "Apple SD Gothic Neo", sans-serif;

  --shadow-card: var(--surface-shadow);
  --shadow-pop: var(--surface-shadow-pop);
  --shadow-sheet: var(--surface-shadow-sheet);
```

`bg-bg-neutral`처럼 접두사가 겹쳐 보이는 것은 알고 둔 것이다. 역할 토큰 이름이 `bg.neutral`이고 Tailwind 유틸 접두사도 `bg-`라서다. 이름을 하나로 유지해야 위의 표에서 찾은 것을 그대로 옮겨 적을 수 있다.

### 8.3 shadcn 다리

shadcn/ui가 만들어내는 컴포넌트는 `bg-primary`, `text-muted-foreground`, `border-border` 같은 자기 이름을 쓴다. 이 이름들을 우리 역할 토큰에 연결해두면 컴포넌트를 설치한 그 순간부터 우리 색으로 나온다. 연결을 안 하면 shadcn 기본 색이 그대로 남는다.

아래는 결정된 역할 토큰에서 기계적으로 끌어낸 것이다. 새로 정한 색은 없다. 그래도 표에서 뽑아내지 않고 펜스로 두는 것은, 이 짝이 우리 이름 체계가 아니라 shadcn의 이름 체계라서다. 우리 표에 shadcn의 이름을 담을 칸이 없다.

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

### 8.4 베이스

body가 배경색과 글자색을 명시로 받는다. 파일 맨 뒤에 그대로 놓인다.

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

## 9. 바깥이 정한 값

**이 절의 값은 우리가 못 바꾼다.** 다른 곳이 정해서 우리에게 지킬 것을 요구한 값이고, 여기 있는 이유는 화면 코드가 리터럴을 못 쓰기 때문이다. 토큰을 거치면 `house/no-color-literals`가 통과하니 규칙에 구멍을 내지 않고 풀린다.

팔레트를 다시 뽑을 때 **이 절은 같이 움직이지 않는다.** brand의 hue를 옮기든 명도 곡선을 다시 그리든 아래 값은 그대로다. 우리 색이 아니라서다.

접두어가 `--vendor-`인 것도 그래서다. `--palette-`와 `--role-`은 우리가 정하고 우리가 바꾸지만 `--vendor-`는 출처가 바꿀 때만 바뀐다.

### 구글 로그인 버튼

로그인 화면은 구글이 배포하는 SVG 자산을 통째로 쓴다([login.md](../modules/account/screens/login.md#구글-버튼은-구글이-정한다)) — 색이 파일 안에 있어 토큰이 필요 없다. 아래 셋은 지금 코드가 아직 직접 그린 버튼이라 남아 있는 값이고, 코드가 자산으로 바뀌면 이 절을 지운다. 구글이 배경 테마 셋(밝게·중간·어둡게)을 못 박았고, 아래는 어두운 테마의 값이다.

| 변수 | 값 | 자리 | Tailwind 유틸 |
| --- | --- | --- | --- |
| `--vendor-google-bg` | `#131314` | 버튼 배경 | `bg-google-bg` |
| `--vendor-google-stroke` | `#8E918F` | 버튼 테두리 | `border-google-stroke` |
| `--vendor-google-fg` | `#E3E3E3` | 버튼 글자 | `text-google-fg` |

oklch가 아니라 hex다. 구글이 hex로 적었고, 옮겨 적으면서 색공간을 바꾸면 반올림이 끼어 원문과 대조할 수 없게 된다. 못 바꾸는 값은 출처가 쓴 표기 그대로 두는 편이 확인하기 쉽다.

대비는 이 표의 대상이 아니다. 구글이 짝지은 조합이고 우리가 고칠 수 없어서 [7절](#7-대비-검증)에 줄을 더하지 않는다.

이 값을 지키는 것은 취향이 아니다. 구글 문서가 app verification에 required라고 적었고 배포할 때 OAuth 앱 심사가 본다. 출처는 [Google Identity — Branding guidelines](https://developers.google.com/identity/branding-guidelines)다.

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

**되돌리기 어려운 동작에 별도 색을 줄지.** 출근 인증은 한 번 찍으면 되돌리는 길이 없고([attendance/README.md](../modules/attendance/README.md)) 교대 수락도 그렇다. 둘 다 지금은 같은 `bg.brand-solid`라서 한 화면에 브랜드 버튼이 둘 뜰 수 있다. 그러면 어느 쪽이 주요 액션인지 흐려진다.

### 전개하면서 드러난 빈자리

**등장이 아래에서 올라오는 이동 거리.** 6절이 시간과 계단 간격은 담는데 얼마나 올라오는지가 없다. 시안 넷이 다 8px로 그렸으니 값은 사실상 정해졌고 옮겨 적기만 남았다. 문구 회전도 「등장과 같은 눈금」이라 이 값을 같이 쓴다.

**뛰는 점이 커지는 배율.** 5절의 스케일 값 둘은 눌림 0.97과 등장 0.9라 커지는 쪽이 없다. 시안은 1.5로 그렸다. 6px 점이라 실제 화면을 보고 정한다.

**스위치 손잡이의 그림자.** 5절의 셋은 다 면이 화면에서 뜨는 그림자라 20px 손잡이에 쓰기엔 크다. 시안이 `0 1px 2px rgba(0,0,0,.2)`로 그렸다. 실제 화면에서 손잡이가 끔 트랙 위에서 구분되는지 보고 넷째 값으로 올릴지, 테두리로 바꿀지 정한다.

**바텀시트 위의 손잡이.** 시트 맨 위에 짧은 가로 막대를 둘지가 안 정해졌다. 아이폰에서 끌어내려 닫는 것이 되는 시트라는 표시인데, 우리 시트는 버튼으로 닫는 자리라 표시만 있고 동작이 없으면 거짓말이 된다. 끌어내려 닫는 것을 붙일지와 같이 정한다.

**큰 글자의 자간.** 4절 타이포 표에 letter-spacing 열이 없다. `text-2xl`쯤부터는 기본 자간이 넓어 보여서 시안들이 −0.01~−0.02em을 각자 얹고 있다.

**스피너가 도는 시간.** 6절 duration 넷은 시작과 끝이 있는 전환의 값이라 끝없이 도는 것에 안 맞는다. 이징도 `ease-out`이 아니라 `linear`여야 한다 — 도는 것에 가속이 붙으면 멈췄다 가는 것으로 보인다. 6절이 이징을 하나로 못 박아둔 것과 부딪히는 자리다.

**축하 모션을 쓸 자리.** [foundation/motion.md](foundation/motion.md#축하할-순간)에 적었듯 출근 인증 완료 하나는 확실한데, 두 번째로 지목됐던 "급여 확정"은 도메인에 없는 행위다. `docs/2-design/modules/payroll/README.md`가 급여를 확정하지 않는다고 못 박아뒀다.
