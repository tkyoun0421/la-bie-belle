# 컴포넌트

컴포넌트마다 어떤 역할 토큰을 쓰는지 적는다. 개발자가 색을 고르지 않아도 되게 하려는 것이다. 표에 없는 조합이 필요하면 지어내지 말고 표에 줄을 더한다.

값은 [tokens.md](tokens.md)에만 있다. 이 문서는 토큰 이름으로만 말한다.

## 어디서 오는가

`shadcn/ui`를 쓴다. 우리가 설치한 shadcn은 `@base-ui/react` 위에 올라가 있다.

base-ui는 동작과 접근성만 담당하고 스타일을 들고 있지 않다. 애니메이션 엔진도 없다. 열림과 닫힘 같은 상태를 data attribute로 노출할 뿐이고 움직임은 CSS에 맡긴다. 덕분에 우리 토큰을 그대로 얹을 수 있고, 컴포넌트를 쓰려고 다른 스타일 체계를 같이 들여올 일이 없다.

shadcn이 만들어내는 클래스 이름(`bg-primary`, `text-muted-foreground`, `border-border`)은 [tokens.md의 shadcn 다리](tokens.md#83-shadcn-다리)가 우리 역할 토큰에 연결한다. 설치한 컴포넌트를 손대지 않아도 우리 색으로 나온다는 뜻이다.

shadcn 기본 목록에 없어서 우리가 정의하는 것이 둘이다. `BottomCTA`와 `ListRow`고, 이름은 토스 TDS에서 가져왔다.

## 아이콘

`lucide-react`를 쓴다. 이미 설치돼 있다.

아이콘 색은 옆 글자와 같은 `fg` 토큰을 따른다. 아이콘만 다른 색으로 두지 않는다.

예외는 **뜻을 아이콘이 나르는 자리**다. [알림 블록](#알림-블록)과 [토스트](#토스트)가 그렇다 — 글자는 읽히는 데만 집중하고 무슨 종류인지는 아이콘 색이 말한다. 두 자리 다 계열색을 쓰고, 그 값은 각 절의 표에 있다. 경고 아이콘이 역할 토큰 없이 `warning-500`을 직접 부르는 것도 여기다(`fg.warning`은 만들지 않았다 — [tokens.md](tokens.md)).

아이콘 크기는 옆 글자 크기를 따라간다. 본문 옆이면 본문 크기, 부가 텍스트 옆이면 부가 텍스트 크기다.

**선으로 그린다.** lucide 기본이 그렇고 화면 대부분이 그 결이다. 면으로 채우는 자리는 토스트 하나뿐이다 — 반전 면 위에서 선은 얇아서 계열색이 안 보이는데, 면은 덩어리라 같은 색이 산다. 다른 자리에서 면을 쓰고 싶어지면 그 근거를 여기 적고 목록에 더한다.

## Button

| 변형 | 배경 | 글자 | 테두리 | 누를 때 배경 |
| --- | --- | --- | --- | --- |
| primary | `bg.brand-solid` | `fg.brand-contrast` | 없음 | `bg.brand-solid-pressed` |
| secondary | `bg.neutral-weak` | `fg.neutral` | 없음 | `bg.neutral-weak-pressed` |
| outline | 없음 | `fg.neutral` | `stroke.neutral` | `bg.neutral-weak` |
| ghost | 없음 | `fg.neutral-muted` | 없음 | `bg.neutral-weak` |
| destructive | `bg.critical-solid` | `fg.brand-contrast` | 없음 | `bg.critical-solid-pressed` |

모양은 `rounded-full`, 라벨은 `font-medium`이다.

한 화면에 primary는 하나다. 브랜드 색이 신호로 작동하려면 그 색을 쓰는 버튼이 하나여야 한다. 두 번째 액션은 secondary나 ghost로 내린다.

destructive는 웬만하면 안 쓴다. 정말로 되돌릴 길이 없는 자리에만 남긴다. 계정 탈퇴가 그 자리고, 근무표 삭제는 아니다 — 지우고 다시 만들 수 있으면 일반 버튼이다. 삭제라는 말이 붙었다고 자동으로 빨강이 되지 않는다. 빨강이 흔해지면 진짜로 멈춰야 하는 자리에서 아무도 안 멈춘다. 출근 인증처럼 되돌릴 수 없지만 파괴가 아닌 동작은 primary다.

비활성은 계열을 나누지 않는다. primary든 destructive든 outline이든 비활성이면 같은 회색이다. 눌리지 않는 버튼이 무슨 색이었는지는 알 필요가 없고, 계열마다 흐린 색을 따로 두면 비활성인지 그냥 연한 버튼인지 헷갈린다.

| 자리 | 토큰 |
| --- | --- |
| 배경 | `bg.neutral-disabled` |
| 글자 | `fg.neutral-disabled` |
| 테두리 | `stroke.neutral-disabled` |

## BottomCTA

화면 하단에 고정되는 주요 액션 버튼이다. 관리자 근무표의 「확정하기」와 근무자 근무 신청의 「보내기」가 여기다 — 화면을 다 채운 뒤 마지막에 한 번 누르는 것들이다.

**화면의 끝이 아닌 버튼은 여기 오지 않는다.** 그 버튼이 답하는 것이 화면 어딘가에 그려져 있으면 둘을 붙여 둔다. 대시보드의 출근 인증이 그렇다 — 하루 띠가 지금이 인증 창 안인지를 그리고 버튼은 그 창에 대한 답이라, 화면 아래로 내리면 사이에 이번 주 근무와 급여가 끼어 왜 지금 눌리는지가 안 이어진다([pages/dashboard.md](pages/dashboard.md#규칙과-부딪힌-자리)).

| 자리 | 토큰 |
| --- | --- |
| 컨테이너 배경 | `bg.neutral` |
| 컨테이너 위쪽 선 | `stroke.neutral` |
| 버튼 | Button primary와 같다 |
| 보조 문구 | `fg.neutral-subtle` |

버튼은 화면 폭에서 좌우 여백만 남기고 채운다. 컨테이너는 스크롤과 무관하게 바닥에 붙어 있고, 아래쪽 안쪽 여백에 `env(safe-area-inset-bottom)`을 더한다. 아이폰 홈 인디케이터에 버튼이 깔리는 것을 막으려는 것이다. 이 앱은 PWA라 홈 화면에서 실행되면 브라우저 주소창이 없다.

컨테이너 위쪽 선은 스크롤이 남아 있을 때만 그린다. 목록 끝까지 내려와 잘릴 것이 없으면 선을 지운다. 선이 항상 있으면 짧은 화면에서 근거 없이 구획이 생긴다.

BottomCTA 안에 버튼을 둘 두지 않는다. 두 개가 필요해 보이면 하나는 본문 안으로 올린다. 화면 맨 아래에서 엄지가 닿는 자리는 하나뿐이고, 둘을 나란히 두면 잘못 누르기 쉽다.

## ListRow

근무 목록, 급여 내역, 알림 목록의 한 줄이다. 이 앱에서 가장 많이 나오는 조각이다.

**목록이 아닌 자리에는 안 쓴다.** 대시보드 맨 위의 안 본 알림이 그렇다 — 하나만 서고, 오른쪽에 ✕와 CTA가 세로로 붙고, 답하면 줄 내용이 결과로 바뀐다. 같은 알림이 알림 목록 화면에서는 ListRow로 그려지니 한 가지가 두 조각으로 갈리는 셈인데, 알림 목록 화면을 그릴 때 그 둘을 나란히 놓고 다시 본다([pages/dashboard.md](pages/dashboard.md#규칙과-부딪힌-자리)).

| 자리 | 토큰 |
| --- | --- |
| 배경 | `bg.neutral` |
| 누를 때 배경 | `bg.neutral-weak-pressed` |
| 제목 | `fg.neutral` |
| 보조 정보 | `fg.neutral-subtle` |
| 오른쪽 값 | `fg.neutral` |
| 오른쪽 화살표 | `fg.neutral-subtle` |
| 줄 사이 구분선 | `stroke.neutral` |

왼쪽에 아이콘이나 프로필, 가운데에 제목과 보조 정보, 오른쪽에 값이나 화살표가 온다. 넷 다 선택이고 가운데 제목만 필수다.

구분선은 왼쪽 콘텐츠 시작 지점부터 긋는다. 화면 폭 끝에서 끝까지 그으면 목록이 표처럼 보인다.

누를 수 없는 줄에는 화살표를 붙이지 않고 누름 배경도 걸지 않는다. 화살표는 다음 화면이 있다는 뜻으로만 쓴다.

읽지 않은 알림처럼 상태를 표시해야 하면 왼쪽에 점을 찍는다. 줄 전체의 배경색을 바꾸지 않는다. 배경으로 상태를 나누면 목록을 스크롤할 때 색 띠가 생기고, 여러 상태가 섞이면 무엇이 중요한지 알 수 없게 된다.

## Card

| 자리 | 토큰 |
| --- | --- |
| 배경 | `bg.neutral` |
| 테두리 | `stroke.surface` |
| 그림자 | `shadow-card` |
| 제목 | `fg.neutral` |
| 본문 | `fg.neutral-muted` |

모양은 `rounded-xl`이다. 테두리와 그림자를 항상 같이 건다. 라이트에서는 그림자만, 다크에서는 테두리만 보인다.

카드 안에서 한 겹 더 눌린 면이 필요하면 `bg.neutral-weak`를 깐다. 카드를 또 얹지 않는다.

카드 배경에 브랜드 색을 깔지 않는다.

## Badge

| 변형 | 배경 | 글자 |
| --- | --- | --- |
| neutral | `bg.neutral-weak` | `fg.neutral-muted` |
| brand | `bg.brand-weak` | `fg.brand` |
| positive | `bg.positive-weak` | `fg.positive` |
| critical | `bg.critical-weak` | `fg.critical` |
| informative | `bg.informative-weak` | `fg.informative` |
| warning | `bg.warning-weak` | `fg.neutral` |

모양은 `rounded-full`, 글자는 `text-xs font-medium`이다.

warning만 글자가 `fg.neutral`이다. 다른 변형처럼 같은 계열의 `fg`를 쓸 수 없어서다. 이유는 [foundation/color.md](foundation/color.md#경고색-제약)에 있다.

한 줄에 배지를 셋 이상 붙이지 않는다. 배지가 많아지면 배지가 정보가 아니라 소음이 된다.

## Input

| 자리 | 토큰 |
| --- | --- |
| 배경 | `bg.neutral-weak` |
| 테두리 | `stroke.neutral` |
| 입력 글자 | `fg.neutral` |
| 자리표시 글자 | `fg.neutral-subtle` |
| 라벨 | `fg.neutral-muted` |
| 포커스 테두리 | `stroke.brand-solid` |
| 오류 테두리 | `bg.critical-solid` |
| 오류 문구 | `fg.critical` |

모양은 `rounded-md`다.

오류 문구는 입력 아래에 붙인다. 색만으로 오류를 알리지 않는다. 색약인 사람에게는 테두리 색 변화가 안 보인다.

**아직 쓰는 중인 것에는 오류 테두리를 안 쓴다.** 최소 글자 수에 못 미친다거나 하는 것은 아래 도움말로만 알리고 테두리는 그대로 둔다 — 쓰다 만 것을 틀렸다고 말하는 셈이라서다. 오류 테두리는 사람이 보낸 뒤에 거절당한 자리에 쓴다.

자리표시 글자로 라벨을 대신하지 않는다. 입력을 시작하면 사라져서 무엇을 넣는 칸이었는지 잊게 된다.

## Tabs

| 자리 | 토큰 |
| --- | --- |
| 활성 탭 글자 | `fg.brand` |
| 활성 탭 밑줄 | `stroke.brand-solid` |
| 비활성 탭 글자 | `fg.neutral-subtle` |
| 탭 바 아래 선 | `stroke.neutral` |

활성 탭은 브랜드 색이 나가는 세 자리 중 하나다. 밑줄과 글자 둘 다 브랜드 색을 쓴다.

활성 탭 배경을 `bg.brand-weak`로 채우는 방식도 있는데 쓰지 않는다. 탭 바가 화면 위쪽에 넓게 깔려서, 배경을 채우면 브랜드 색 면적이 버튼보다 커진다.

## 알림 블록

화면 안에 끼는 안내 상자다.

| 종류 | 배경 | 글자 | 아이콘 |
| --- | --- | --- | --- |
| 안내 | `bg.informative-weak` | `fg.neutral` | `fg.informative` |
| 성공 | `bg.positive-weak` | `fg.neutral` | `fg.positive` |
| 경고 | `bg.warning-weak` | `fg.neutral` | `warning-500` |
| 오류 | `bg.critical-weak` | `fg.neutral` | `fg.critical` |

넷 다 글자가 `fg.neutral`이다. 옅은 배경 위에서는 뜻을 아이콘이 나르고 글자는 읽히는 데만 집중한다. 글자까지 색을 입히면 문장이 길어질수록 읽기 힘들어진다.

모양은 `rounded-lg`다.

## 토스트

| 자리 | 토큰 |
| --- | --- |
| 배경 | `bg.neutral-solid-soft` |
| 글자 | `fg.neutral-contrast` |
| 성공 아이콘 | `fg.positive-contrast` |
| 안내 아이콘 | `fg.informative-contrast` |

반전 면이라 라이트에서는 어둡고 다크에서는 밝다. 화면 위에 잠깐 뜨는 것이라 배경과 확실히 갈려야 한다. `bg.neutral-solid`보다 한 단계 무른 면을 쓰는 것은 그것이 달력의 오늘 원과 같은 토큰이라 같은 진하기로 뜨면 화면에 앉은 것으로 읽히기 때문이다.

**모양은 알약이다.** `rounded-full`에 내용 폭이고 `shadow-card`로 떠 있다. 좌우로 늘리지 않는다 — 전폭 바에 짧은 문장이 들어가면 Button과 구분이 안 된다. 폭이 화면에 닿을 만큼 긴 문장은 좌우 24px 여백을 남기는 선에서 멈추고 줄을 바꾼다.

화면 아래에서 56px에 뜬다. 하단에 [BottomCTA](#bottomcta)가 선 화면에서는 88px이라 그 버튼을 안 가린다. 토스트가 덮으면 방금 누른 버튼이 사라져 무엇을 눌렀는지가 흐려진다.

**왼쪽에 아이콘이 선다.** 16px이고 면으로 그린다([아이콘](#아이콘)) — 원이 계열색으로 차고 안쪽 표시가 면 색으로 뚫린 모양이다. 안쪽 표시는 lucide 기본보다 1.35배 크고 획도 같은 비율로 두껍다. 기본 크기로는 16px 원 안에서 표시가 안 읽힌다.

종류는 성공과 안내 둘이다. 알림 블록의 넷을 그대로 가져오지 않는 것은 토스트가 사라지는 것이라서다 — 경고와 오류는 사람이 조치할 것이 있는 자리고, 그것을 사라지는 것에 실으면 안 된다. 조치할 게 없는 통보만 토스트로 간다.

토스트에는 버튼을 넣지 않는다. 사라지는 것에 액션을 걸면 놓친 사람이 그 액션을 다시 찾을 길이 없다.

## Dialog와 바텀시트

| 자리 | 토큰 |
| --- | --- |
| 면 배경 | `bg.neutral` |
| 뒤 덮개 | `bg.scrim` |
| 제목 | `fg.neutral` |
| 본문 | `fg.neutral-muted` |
| 왼쪽 버튼 | Button secondary |
| 오른쪽 버튼 | Button primary 또는 destructive |

모양은 `rounded-lg`다. 바텀시트는 위쪽 두 모서리만 둥글다.

덮개는 투명도가 토큰 안에 들어 있어 따로 얹지 않는다. `bg.neutral-solid`를 쓰면 안 되는 이유는 그 토큰이 팔레트를 따라 다크에서 밝은 회색이 되어 화면을 흰 막이 덮기 때문이다 — 근거는 [tokens.md](tokens.md#bg)에 있다.

왼쪽 버튼 라벨은 "닫기"다. "취소"라고 쓰지 않는 이유는 [writing.md](writing.md#다이얼로그-왼쪽-버튼은-닫기다)에 있다.

앱을 열자마자 바텀시트로 화면을 덮지 않는다.

## 근무표 날짜 칸

색 규칙이 가장 쉽게 무너지는 자리다. 규칙의 근거는 [foundation/color.md](foundation/color.md#근무표에서-색을-쓰는-법)에 있고, 여기는 칸별 조합만 적는다.

근무자 조회 상태다.

| 상태 | 배경 | 날짜 글자 | 테두리 | 표식 |
| --- | --- | --- | --- | --- |
| 근무 있음 | `bg.brand-weak` | `fg.neutral` | 없음 | `bg.brand-solid` 점 |
| 근무 요청 온 날 | `bg.neutral-weak` | `fg.neutral-muted` | `stroke.brand-solid` 점선, 도는 중 | 없음 |
| 근무 없음(열린 날) | `bg.neutral-weak` | `fg.neutral-muted` | 없음 | 없음 |
| 안 연 날 | 없음 | `fg.neutral-subtle` | 없음 | 없음 |
| 확정 전 | 없음 | `fg.neutral-subtle` | `stroke.neutral-muted` 점선 | 없음 |
| 확정 전 — 신청에서 고른 날 | `bg.brand-weak-selected` | `fg.neutral` | `stroke.brand-solid` | 체크 |

**오늘은 위 상태들과 나란히 서지 않고 그 위에 얹힌다.** 칸 배경은 그날의 상태를 그대로 두고, 날짜 숫자를 지름 21px의 `bg.neutral-solid` 원이 감싼다. 원 안 숫자는 `fg.neutral-contrast`다. 오늘이면서 근무가 있는 날은 브랜드 면에 검은 원과 그 아래 브랜드 점이 같이 선다 — 상태 둘이 서로를 지우지 않는다.

오늘을 칸 색이 아니라 원으로 그리는 이유는 [foundation/color.md](foundation/color.md#근무표에서-색을-쓰는-법)에 있다.

근무 요청 온 날의 점선은 시계 방향으로 돈다. 주기는 `--interval-dash`고 대시와 간격은 각각 3px다. 요청이 수락·거절·만료로 끝나거나 자리가 차면 이 칸은 「근무 있음」이나 「근무 없음(열린 날)」로 돌아간다. 점선을 `border`가 아니라 SVG의 `stroke-dasharray`로 그리는 것은 `border`가 애니메이션을 못 받고, 확정 전 칸의 점선 `border`와 한 칸에서 부딪히기 때문이다.

관리자 편집 상태다. [pages/schedule-admin.md](pages/schedule-admin.md#달력-칸)가 더한 것을 여기로 합쳤다. 그 문서의 「닫힌 날」은 이 표의 「안 연 날」과 같은 것이다.

| 상태 | 배경 | 날짜 글자 | 테두리 | 표식 |
| --- | --- | --- | --- | --- |
| 안 연 날 | 없음 | `fg.neutral-subtle` | 없음 | 없음 |
| 열린 날 | `bg.neutral-weak` | `fg.neutral` | 없음 | 신청 수 또는 빈 자리 |
| 선택된 날 — 열기 모드 | `bg.brand-weak-selected` | `fg.neutral` | `stroke.brand-solid` | 체크 |

오늘은 여기서도 같은 검은 원이다. 한 컴포넌트가 화면마다 오늘을 다르게 그리지 않는다.

브랜드 색으로 칸이 채워지는 자리는 근무자 달력의 내 근무와 열기 모드의 선택 칸 둘뿐이다. 둘 다 옅은 면이고 꽉 찬 브랜드 면은 달력에 없다.

교육 배정은 근무 있음과 같은 칸이다. 교육인지는 칸이 아니라 명단과 목록의 글자가 말한다.

"안 연 날"은 관리자가 그날에 자리를 안 깔아 배정이 불가능한 날이고, "확정 전"은 근무표 자체가 아직 공개되지 않은 상태다. 둘 다 [domain/schedule.md](../../domain/schedule.md)의 용어다. 안 연 날은 확정된 사실이라 흐린 글자로 끝내고, 확정 전은 아직 모른다는 뜻이라 점선으로 그린다.

달력 한 장에서 쓰는 색은 브랜드와 뉴트럴 둘뿐이다. 상태가 여럿인데 색을 둘로 버티는 것은, 상태마다 색을 붙이면 달력이 색 지도가 되고 정작 내 근무가 어디인지 안 보이기 때문이다.

## 하루 띠

하루를 가로축 하나로 눕히고 그날의 근무를 얹는다. 근무표 날짜 칸처럼 색 규칙이 따로 붙는 조각이라 [foundation/color.md](foundation/color.md#근무표에서-색을-쓰는-법)와 양쪽에 걸친다. 대시보드가 첫 사용자고 상세는 [pages/dashboard.md](pages/dashboard.md#하루-띠)에 있다.

축은 06:00부터 21:00까지 15시간이다. 양끝을 눈금으로 그리지 않는다 — 몇 시부터 몇 시까지인지를 읽는 띠가 아니라 지금 어디쯤인지를 보는 띠다.

세 겹이다.

| 겹 | 무엇 | 토큰 |
| --- | --- | --- |
| 트랙 | 하루 전체 | `bg.neutral-weak` |
| 트랙 — 확정 전 | 면 없이 점선 | `stroke.neutral-muted` |
| 막대 | 근무 시간 | `bg.brand-muted` |
| 막대 위 시각 | 시작과 끝 | `fg.neutral` |
| 지금 선 | 현재 시각 | `bg.brand-solid` |
| 지금 시각 라벨 | 선 위에 붙는다 | `fg.brand` |

막대 안에 시작과 끝 시각을 넣는다. 밖에 적으면 선이나 화살표로 어느 막대의 시각인지를 다시 알려야 한다.

막대는 옅은 면이고 누르는 것이 아니다. 같은 화면의 주요 액션 버튼이 꽉 찬 브랜드 면이라 무게가 갈린다 — 브랜드 색이 한 화면에 여럿이어도 누를 수 있는 것은 하나다.

근무가 없는 날은 막대가 없고 트랙과 지금 선만 남는다. 빈 상태를 위해 다른 배치를 만들지 않는다.

## 빈 상태

아직 안 그려봤다. [tokens.md의 미정 목록](tokens.md#아직-안-정한-것)에 있다. 근무 없는 날, 급여 0원, 알림 0건을 이 팔레트로 어떻게 그릴지 정해지면 여기에 적는다.
