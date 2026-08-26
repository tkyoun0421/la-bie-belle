# 컴포넌트

컴포넌트마다 어떤 역할 토큰을 쓰는지 적는다. 개발자가 색을 고르지 않아도 되게 하려는 것이다. 표에 없는 조합이 필요하면 지어내지 말고 표에 줄을 더한다.

값은 [tokens.md](tokens.md)에만 있다. 이 문서는 토큰 이름으로만 말한다.

## 어디서 오는가

`shadcn/ui`를 쓴다. 우리가 설치한 shadcn은 `@base-ui/react` 위에 올라가 있다.

base-ui는 동작과 접근성만 담당하고 스타일을 들고 있지 않다. 애니메이션 엔진도 없다. 열림과 닫힘 같은 상태를 data attribute로 노출할 뿐이고 움직임은 CSS에 맡긴다. 덕분에 우리 토큰을 그대로 얹을 수 있고, 컴포넌트를 쓰려고 다른 스타일 체계를 같이 들여올 일이 없다.

shadcn이 만들어내는 클래스 이름(`bg-primary`, `text-muted-foreground`, `border-border`)은 [tokens.md의 shadcn 다리](tokens.md#85-shadcn-다리)가 우리 역할 토큰에 연결한다. 설치한 컴포넌트를 손대지 않아도 우리 색으로 나온다는 뜻이다.

shadcn 기본 목록에 없어서 우리가 정의하는 것이 둘이다. `BottomCTA`와 `ListRow`고, 이름은 토스 TDS에서 가져왔다.

## 아이콘

`lucide-react`를 쓴다. 이미 설치돼 있다.

아이콘 색은 옆 글자와 같은 `fg` 토큰을 따른다. 아이콘만 다른 색으로 두지 않는다. 유일한 예외가 경고 아이콘이고 `warning-500`을 쓴다.

아이콘 크기는 옆 글자 크기를 따라간다. 본문 옆이면 본문 크기, 부가 텍스트 옆이면 부가 텍스트 크기다.

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

destructive는 되돌릴 수 없이 지우는 자리에만 쓴다. 근무표 삭제나 계정 탈퇴가 여기다. 출근 인증처럼 되돌릴 수 없지만 파괴가 아닌 동작은 primary다.

`disabled` 값이 아직 없다. 비활성 버튼이 필요한 자리는 [tokens.md의 미정 목록](tokens.md#아직-안-정한-것)에 올려뒀다.

## BottomCTA

화면 하단에 고정되는 주요 액션 버튼이다. 출근 인증이 여기다.

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
| 배경 | `bg.neutral-solid` |
| 글자 | `fg.neutral-contrast` |

반전 면이라 라이트에서는 어둡고 다크에서는 밝다. 화면 위에 잠깐 뜨는 것이라 배경과 확실히 갈려야 한다.

토스트에는 버튼을 넣지 않는다. 사라지는 것에 액션을 걸면 놓친 사람이 그 액션을 다시 찾을 길이 없다.

## Dialog와 바텀시트

| 자리 | 토큰 |
| --- | --- |
| 면 배경 | `bg.neutral` |
| 뒤 덮개 | `bg.neutral-solid`에 투명도 |
| 제목 | `fg.neutral` |
| 본문 | `fg.neutral-muted` |
| 왼쪽 버튼 | Button secondary |
| 오른쪽 버튼 | Button primary 또는 destructive |

모양은 `rounded-lg`다. 바텀시트는 위쪽 두 모서리만 둥글다.

왼쪽 버튼 라벨은 "닫기"다. "취소"라고 쓰지 않는 이유는 [writing.md](writing.md#다이얼로그-왼쪽-버튼은-닫기다)에 있다.

앱을 열자마자 바텀시트로 화면을 덮지 않는다.

## 근무표 날짜 칸

색 규칙이 가장 쉽게 무너지는 자리다. 규칙의 근거는 [foundation/color.md](foundation/color.md#근무표에서-색을-쓰는-법)에 있고, 여기는 칸별 조합만 적는다.

| 상태 | 배경 | 날짜 글자 | 테두리 | 표식 |
| --- | --- | --- | --- | --- |
| 오늘이면서 근무 있음 | `bg.brand-solid` | `fg.brand-contrast` | 없음 | 없음 |
| 오늘이면서 근무 없음 | `bg.brand-solid` | `fg.brand-contrast` | 없음 | 없음 |
| 근무 있음 | `bg.neutral` + `shadow-card` | `fg.neutral` | `stroke.surface` | `bg.brand-solid` 점 |
| 근무 없음 | 없음 | `fg.neutral-muted` | 없음 | 없음 |
| 안 연 날 | 없음 | `fg.neutral-subtle` | 없음 | 없음 |
| 확정 전 | 없음 | `fg.neutral-subtle` | `stroke.neutral-muted` 점선 | 없음 |
| 교육 배정 | `bg.neutral` + `shadow-card` | `fg.neutral` | `stroke.surface` | `fg.neutral-subtle` 점 |

브랜드 색으로 칸이 채워지는 것은 오늘 하루뿐이다. 근무가 있는 날은 카드로 떠오르고 브랜드 색은 점에만 쓴다.

"안 연 날"은 관리자가 그날에 자리를 안 깔아 배정이 불가능한 날이고, "확정 전"은 근무표 자체가 아직 공개되지 않은 상태다. 둘 다 [domain/schedule.md](../domain/schedule.md)의 용어다. 안 연 날은 확정된 사실이라 흐린 글자로 끝내고, 확정 전은 아직 모른다는 뜻이라 점선으로 그린다.

달력 한 장에서 쓰는 색은 브랜드와 뉴트럴 둘뿐이다. 상태가 일곱인데 색을 둘로 버티는 것은, 상태마다 색을 붙이면 달력이 색 지도가 되고 정작 오늘이 어디인지 안 보이기 때문이다.

## 빈 상태

아직 안 그려봤다. [tokens.md의 미정 목록](tokens.md#아직-안-정한-것)에 있다. 근무 없는 날, 급여 0원, 알림 0건을 이 팔레트로 어떻게 그릴지 정해지면 여기에 적는다.
