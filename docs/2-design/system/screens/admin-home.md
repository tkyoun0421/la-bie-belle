# 관리자 홈

## 목적과 진입

관리자가 관리자 모드로 들어와 갈라지는 자리다. 근무표와 근무 시간 기본값은 이 화면 안에서 끝나고, 승인할 일·가입 대기·직원·시급·QR·통계는 각자의 화면으로 나가는 문이다. 여러 영역이 한 화면에 모여서 근무표 밖에 산다 — 근무표 문서의 한 절이면 급여와 계정과 출근으로 가는 문을 근무표가 소유하게 된다.

들어오는 문은 하나다. [프로필](../../modules/account/screens/profile.md#관리자-모드)의 「관리자 모드」 줄이고, 앱바의 뒤로가 그 자리로 돌아가는 유일한 길이다. 관리자도 자기 근무가 있어 평소에는 근무자 화면을 쓰고 관리하러 갈 때만 이 문을 지난다([account/README.md](../../modules/account/README.md#acc-008)).

경로와 역할 조건은 [navigation.md](../navigation.md#경로)가 든다. 값은 [tokens.md](../../design-system/tokens.md)에만 있고 여기는 토큰 이름으로만 말한다. 주 타깃은 폰 세로 화면이다.

근무표를 만들고 날을 열고 확정하는 흐름은 [schedule-admin.md](../../modules/schedule/screens/schedule-admin.md)가 담는다. 예시 값도 그 문서의 시나리오를 그대로 쓴다 — 오늘은 9월 29일(화)이고 2026년 10월 근무표를 만드는 중이다. 오늘 현황과 빈 자리 카드만 확정 뒤인 10월 8일(목)이다. 확정 전에는 오늘 현황의 값이 「–」라 그 자리가 무엇을 말하는지 보여주지 못한다.

움직이는 모습은 옆의 `admin-home.sian.html`을 브라우저로 열어 본다. 시안과 이 문서가 어긋나면 이 문서가 이긴다.

## 참조 기준

- 업무 규칙 — [schedule/README.md](../../modules/schedule/README.md#용어)의 용어, [account/README.md](../../modules/account/README.md#acc-008)의 ACC-008, [notification/README.md](../../modules/notification/README.md#ntf-013)의 NTF-013, [notification/README.md](../../modules/notification/README.md#ntf-032)의 NTF-032
- 기획 — [intent/schedule-admin.md](../../../1-plan/intent/schedule-admin.md#뼈대)
- 탐색 — [navigation.md](../navigation.md#경로)
- 공통 시각·문안 — [tokens.md](../../design-system/tokens.md), [components.md](../../design-system/components.md), [color.md](../../design-system/foundation/color.md), [motion.md](../../design-system/foundation/motion.md), [writing.md](../../design-system/writing.md)
- 다른 영역 — [profile.md](../../modules/account/screens/profile.md), [members-pending.md](../../modules/account/screens/members-pending.md), [members.md](../../modules/account/screens/members.md), [wages.md](../../modules/payroll/screens/wages.md), [qr.md](../../modules/attendance/screens/qr.md), [excuse.md](../../modules/attendance/screens/excuse.md), [approvals.md](approvals.md), [stats.md](stats.md), [dashboard.md](dashboard.md), [schedule-admin.md](../../modules/schedule/screens/schedule-admin.md)

## 화면 상태와 흐름

| 상태 | 진입 조건·계기 | 보이는 내용 | 가능한 행동 | 다음 상태·목적지 |
| --- | --- | --- | --- | --- |
| 정상 | [프로필](../../modules/account/screens/profile.md#관리자-모드)의 「관리자 모드」 줄 | 앱바, 오늘 현황, 근무표 관리 타일, 이번 달 미니뷰, 가는 선, 근무 시간 기본값 줄, 승인할 일 줄, 가입 대기 줄, 가는 선, 직원·시급·QR·통계 줄 | 오늘 현황을 누른다. 타일을 누른다. 미니뷰를 누른다. 기본값 줄을 누른다. 나머지 여섯 줄을 누른다. 앱바의 뒤로 | 날 상세 · [월 달력](../../modules/schedule/screens/schedule-admin.md#월-달력) · 기본값 시트 · 각자의 화면 · 프로필 |
| 근무표 상태가 갈릴 때 | 그 달 근무표가 아직 없음·만드는 중·확정 뒤 | 타일 안 요약 줄이 지금 상태를 말한다 | 타일을 누른다 | [월 달력](../../modules/schedule/screens/schedule-admin.md#월-달력) 또는 [달 근무표 만들기](../../modules/schedule/screens/schedule-admin.md#달-근무표-만들기) |
| 예식 3일 안에 빈 자리 | 확정 뒤 예식이 사흘 안인데 빈 자리가 남았다 | 타일 아래에 빈 자리 카드가 날짜마다 한 장 | 카드를 누른다 | 그날 날 상세 |
| 오늘 근무가 없다 | 그날 배정이 없다 | 오늘 현황 자리가 통째로 없다 | 나머지 그대로 | — |
| 기본값 시트 | 근무 시간 기본값 줄을 누른다 | 출근·퇴근 두 칸과 도움말, 버튼 둘 | 고쳐서 바꾼다 | 이미 연 날은 그대로다 |

## 짜임과 토큰

### 관리자 홈 짜임

관리자가 관리자 모드에서 처음 보는 화면이고 관리자 쪽의 허브다. 여기서 갈라지고 앱바의 뒤로로 돌아온다 — 관리자 화면에는 [탭 바](../../design-system/components.md#탭-바)가 없다.

근무표 관리와 근무 시간 기본값은 이 화면 안에서 끝나고, 아래 여섯 줄은 숫자나 값만 말한 뒤 눌리면 각자의 화면이 열린다([approvals.md](approvals.md), [members-pending.md](../../modules/account/screens/members-pending.md), [members.md](../../modules/account/screens/members.md), [wages.md](../../modules/payroll/screens/wages.md), [qr.md](../../modules/attendance/screens/qr.md), [stats.md](stats.md)).

들어오는 문은 [프로필](../../modules/account/screens/profile.md#관리자-모드)의 「관리자 모드」 줄이다. 관리자도 자기 근무가 있어 평소에는 근무자 화면을 쓰고 관리하러 갈 때만 이 문을 지난다([account/README.md](../../modules/account/README.md#acc-008)).

세로로 쌓는다.

1. 앱바 — 뒤로, 「관리자」, 오른쪽에 [종 아이콘](../../design-system/components.md#종-아이콘)과 브랜드 마크. 뒤로는 [프로필](../../modules/account/screens/profile.md#관리자-모드)로 돌아가는 유일한 길이다
2. 오늘 현황
3. 근무표 관리 타일
4. 빈 자리 카드
5. 이번 달 근무표 미니뷰
6. 가는 선
7. 근무 시간 기본값 줄
8. 승인할 일 줄
9. 가입 대기 줄
10. 가는 선
11. 직원 줄
12. 시급 줄
13. QR 줄
14. 통계 줄

**가는 선이 셋을 가른다.** 맨 위 묶음(2~5)은 지금 무슨 일이 벌어지는지를 보는 자리고, 가운데(7~9)는 이번 달 근무표를 굴리는 일이고, 아래(11~14)는 사람과 값과 도구다. 위는 열 때마다 읽고 가운데는 매주 손이 가고 아래는 어쩌다 한 번이다.

**보는 것이 먼저고 하는 것이 뒤다.** 예식 당일 아침에 관리자가 앱을 여는 이유는 「오늘 누가 왔나」지 설정이 아니다. 지금까지는 그 답이 근무표로 들어가 날을 열어야 나왔다.

#### 오늘 현황

앱바 바로 아래 첫 자리다. 숫자 한 줄과 [비율 띠](../../design-system/components.md#비율-띠)다.

| 자리 | 담는 것 | 토큰 |
| --- | --- | --- |
| 이름표 | 오늘 날짜와 요일 | `fg.neutral-subtle` |
| 값 | 그날 배정 인원 | `fg.neutral` |
| 보조 | 출근·안 찍음 | `fg.neutral-muted` |
| 띠 — 찍은 몫 | 출근과 지각을 합친 것 | `bg.brand-solid` |
| 띠 — 안 찍은 몫 | 나머지 | `bg.neutral-weak` |

**여기서는 지각을 따로 안 가른다.** 이 줄이 답하는 것은 「다 왔나」 하나고, 누가 늦었는지는 날 상세의 명단이 말한다. [통계](stats.md#근태-현황-줄)의 비율 띠가 넷으로 갈리는 것과 갈린다 — 그쪽은 달을 돌아보는 자리고 여기는 오늘을 보는 자리다.

**근무가 없는 날은 이 자리가 없다.** 그런 날은 띠가 0으로 서는 것이 아니라 볼 것이 없다.

**확정 전에는 값이 `–`다.** 배정이 아직 안 굳어서 분모가 없다.

**누르면 그날 날 상세로 간다.**

#### 빈 자리 카드

예식이 사흘 안인데 자리가 비어 있는 날마다 한 장이다. 없으면 이 자리가 통째로 없다.

| 자리 | 담는 것 |
| --- | --- |
| 제목 | 날짜와 요일, 빈 자리 수 |
| 아래 줄 | 며칠 남았는지 |

[components.md](../../design-system/components.md#알림-블록)의 경고 블록이다. **타일 안에 있던 것을 밖으로 뺐다** — 안에 두면 한 줄이라 하루치만 말할 수 있었는데, 사흘 안에 예식이 둘이면 둘 다 급하다. 밖으로 나오면 날짜마다 한 장씩 쌓인다.

**누르면 그날 날 상세로 간다.** 빈 자리를 채우러 가는 것이 이 카드의 일이다.

**사흘이 기준인 것은 [NTF-013](../../modules/notification/README.md#ntf-013)과 같다.** 푸시가 예식 3일 전 저녁 9시에 한 번 가고, 이 카드는 그 뒤로 채워질 때까지 화면에 남는다 — 푸시는 한 번이고 카드는 상태다.

#### 이번 달 근무표 미니뷰

[components.md](../../design-system/components.md#미니-달력)의 미니 달력이고 관리자 쪽 표식을 쓴다.

| 자리 | 담는 것 |
| --- | --- |
| 이름표 | 10월 |
| 칸 | 가로 일곱, 날짜 숫자 |
| 칸 배경 | 배정 인원이 많을수록 진해진다 — `bg.brand-weak`에서 `bg.brand-solid`로 |
| 안 연 날 | 빈칸 |
| 오늘 | `bg.neutral-solid` 원 |

**한 달의 모양이 여기서 보인다.** 어느 주에 예식이 몰렸는지, 다음 주가 비었는지를 근무표에 들어가지 않고 안다.

**칸을 따로 안 누른다.** 달력 전체를 누르면 근무표 관리로 간다 — 20px 칸에 날짜를 집으려 하면 옆 칸이 눌린다.

**확정 전에도 선다.** 연 날만 색이 있고 안 연 날은 빈칸이라, 근무표를 만드는 중에는 얼마나 열었는지가 그대로 보인다.

**아래 넷에는 숫자가 없다.** 위의 「승인할 일 · 3건」과 「가입 대기 · 2명」은 답해야 할 것이 쌓였다는 신호지만, 직원 수나 시급 개수는 재촉이 아니다. 숫자를 붙이면 처리해야 할 일처럼 읽힌다.

**통계가 맨 아래다.** 넷 중 유일하게 아무것도 안 바꾸는 자리다 — 보고 나오는 화면이라 손이 가장 늦게 간다.

**근무표 관리만 카드다.** [components.md](../../design-system/components.md#card)의 Card를 그대로 쓴다. 이 화면에서 관리자가 매달 하는 일은 근무표 하나고 나머지는 설정이다. 타일 안에 지금 상태 한 줄이 같이 서서, 들어가기 전에 어디까지 왔는지 보인다. 상태별 요약 줄은 [관리자 홈 문안](#관리자-홈-문안)에 있다.

**빈 자리 경고는 타일 밖으로 나갔다.** 예전에는 타일 요약 줄이 경고 블록으로 승격했는데 그러면 하루치만 말할 수 있었다 — 사흘 안에 예식이 둘이면 둘 다 급하다. 지금은 [빈 자리 카드](#빈-자리-카드)가 타일 아래에 날짜마다 한 장씩 선다. 타일 요약 줄은 근무표 상태 하나만 말한다. 문안의 날짜 셈은 확정 뒤 시나리오(오늘 10월 8일) 기준이다. 빈 자리 재촉 셋 중 홈의 몫이고, 나머지 둘 — 달력 칸 표시와 관리자 푸시 — 은 [확정 뒤](../../modules/schedule/screens/schedule-admin.md#확정-뒤-짜임) 절과 [notification/README.md](../../modules/notification/README.md)에 있다.

**근무 시간 기본값은 줄이다.** [components.md](../../design-system/components.md#listrow)의 ListRow로, 이름표 왼쪽에 값 오른쪽이다. 누르면 바텀시트가 열리고 출근·퇴근 두 칸을 고친다. [schedule/README.md](../../modules/schedule/README.md#용어)가 「기본값을 바꾸는 자리는 관리자 화면에 있다」고 정한 그 자리다.

**기본값을 바꿔도 이미 연 날은 그대로다.** 연 날의 근무 시간은 열던 순간 깔린 값이고, 소급해서 바꾸면 이미 손본 날의 시간까지 덮어버린다. 바꾸고 싶은 날은 날 상세에서 하나씩 고친다.

**승인할 일 줄도 문이다.** ListRow에 대기 건수가 서고, 누르면 [approvals.md](approvals.md)의 목록이 열린다. 근무자가 보낸 사유와 근무 취소 요청이 그 안에 한 목록으로 섞인다. 가입 대기 위에 두는 것은 이쪽이 훨씬 잦아서다 — 사유는 못 찍은 날마다 오고 가입은 몇 달에 한 번이다.

**이 줄의 숫자는 사람이 아니라 건이다.** 한 사람이 사유 둘을 낼 수 있고, 관리자가 처리하는 단위도 건이다. 가입 대기가 「2명」인 것은 그쪽이 사람을 받는 자리이기 때문이다.

**가입 대기 줄은 문이다.** ListRow에 대기 인원 수가 서고, 누르면 [members-pending.md](../../modules/account/screens/members-pending.md)의 목록이 열린다. 처음에는 자리만 잡아두고 눌렀을 때의 화면을 비워뒀는데([intent](../../../1-plan/intent/schedule-admin.md#뼈대)가 이 화면의 확정 항목으로 둘만 못 박았다) 그 화면이 서면서 이어졌다.

**이 줄의 숫자가 새 가입을 알리는 유일한 신호다.** 새 사람이 프로필을 보내도 관리자에게 푸시가 안 간다([notification/README.md](../../modules/notification/README.md#ntf-032)). 대기가 0명이어도 줄은 그대로 서고 눌린다.

**이 화면에 primary 버튼이 없다.** 타일과 줄뿐이다. [color.md](../../design-system/foundation/color.md#브랜드-색을-아끼는-이유)가 로고와 브랜드 색 버튼이 같은 화면에 서면 다시 보라고 했는데, 여기는 버튼이 없어서 브랜드 마크 하나로 끝난다.

#### 관리자 홈 색

| 자리 | 토큰 |
| --- | --- |
| 화면 바탕 | `bg.neutral` |
| 앱바 제목 | `fg.neutral-subtle` |
| 브랜드 마크 | `bg.brand-solid` 면에 `fg.brand-contrast` |
| 타일 | [components.md](../../design-system/components.md#card)의 Card |
| 타일 요약 줄 | `fg.neutral-muted` |
| 타일 화살표 | `fg.neutral-subtle` |
| 줄 이름표 | `fg.neutral` |
| 줄 값 | `fg.neutral-muted` |
| 가는 선 | `stroke.neutral` |
| 기본값 시트 | [사유 시트](../../modules/attendance/screens/excuse.md)와 같은 Dialog 조합 |
| 오늘 현황 이름표 | `fg.neutral-subtle` |
| 오늘 현황 값 | `fg.neutral` |
| 오늘 현황 보조 | `fg.neutral-muted` |
| 오늘 현황 띠 — 찍은 몫 | `bg.brand-solid` |
| 오늘 현황 띠 — 안 찍은 몫 | `bg.neutral-weak` |
| 빈 자리 카드 | [components.md](../../design-system/components.md#알림-블록)의 경고 |
| 미니뷰 칸 | `bg.brand-weak`에서 `bg.brand-solid`까지 |
| 미니뷰 오늘 | `bg.neutral-solid` 원에 `fg.neutral-contrast` |

#### 관리자 홈 글자

| 자리 | 유틸 |
| --- | --- |
| 앱바 제목 | `text-sm` |
| 타일 제목 | `text-lg font-semibold` |
| 타일 요약 줄 | `text-sm` |
| 줄 이름표 | `text-base font-medium` |
| 줄 값 | `text-sm` |
| 오늘 현황 이름표 | `text-sm` |
| 오늘 현황 값 | `text-xl font-bold` |
| 오늘 현황 보조 | `text-sm` |
| 미니뷰 이름표 | `text-sm` |
| 미니뷰 날짜 숫자 | `text-xs` |

타일 요약 줄과 기본값 줄의 시각에 `tabular-nums`를 건다. 오늘 현황의 숫자도 같다.

#### 관리자 홈 여백과 모양

| 자리 | 유틸 |
| --- | --- |
| 화면 좌우 여백 | `px-6` |
| 앱바와 첫 자리 사이 | `mt-2` |
| 오늘 현황 이름표와 값 사이 | `mt-1` |
| 오늘 현황 띠 | 값 줄 아래 `mt-3`, 높이 8px |
| 오늘 현황과 타일 사이 | `mt-6` |
| 타일 | `rounded-xl` `p-6` |
| 타일과 빈 자리 카드 사이 | `mt-3` |
| 빈 자리 카드끼리 | `mt-2` |
| 빈 자리 카드와 미니뷰 사이 | `mt-6` |
| 미니뷰 이름표와 달력 사이 | `mt-2` |
| 미니뷰 | [components.md](../../design-system/components.md#미니-달력)의 값 |
| 미니뷰와 선 사이 | `mt-6` |
| 줄 | `py-4` |
| 시트 | [components.md](../../design-system/components.md#dialog와-바텀시트)의 바텀시트. 위쪽만 `rounded-lg` |

**자리가 빠지면 위 간격을 이어받는다.** 오늘 현황이 없는 날에는 타일이 앱바 바로 아래에 `mt-2`로 서고, 빈 자리가 없으면 미니뷰가 타일 아래에 `mt-6`으로 선다.

## 문안

### 관리자 홈 문안

| 상태·위치 | 최종 문구 | 가변값·표기 조건 |
| --- | --- | --- |
| 앱바 제목 | 관리자 | — |
| 타일 제목 | 근무표 관리 | — |
| 타일 요약 줄 — 아직 없음 | 10월 근무표가 아직 없어요 | 그 달 |
| 타일 요약 줄 — 만드는 중 | 10월 근무표 · 열린 날 9 · 빈 자리 6 | 열린 날 수와 빈 자리 수 |
| 타일 요약 줄 — 확정 뒤 | 10월 근무표를 확정했어요 · 빈 자리 2 | 빈 자리 수 |
| 빈 자리 카드 제목 | 10월 10일(토) 예식에 빈 자리 1 | 날짜와 요일과 빈 자리 수 |
| 빈 자리 카드 아래 줄 | 2일 남았어요 | 날짜 셈은 확정 뒤 시나리오 기준. 당일이면 「오늘이에요」 |
| 오늘 현황 이름표 | 10월 8일(목) | 오늘 날짜와 요일 |
| 오늘 현황 값 | 9명 | 그날 배정 인원 |
| 오늘 현황 보조 | 출근 7 · 안 찍음 2 | 안 찍음이 0이면 「전원 출근했어요」 |
| 오늘 현황 — 확정 전 | – | 배정이 안 굳었을 때 |
| 미니뷰 이름표 | 10월 | 보는 달 |
| 기본값 줄 | 근무 시간 기본값 · 10:00–19:00 | 지금 기본값 |
| 승인할 일 줄 | 승인할 일 · 3건 | 대기 건수 |
| 가입 대기 줄 | 가입 대기 · 2명 | 대기 인원 수. 0명이어도 줄은 선다 |
| 직원 줄 | 직원 | — |
| 시급 줄 | 시급 | — |
| QR 줄 | QR | — |
| 통계 줄 | 통계 | — |
| 기본값 시트 제목 | 근무 시간 기본값 | — |
| 기본값 시트 라벨 | 출근 · 퇴근 | — |
| 기본값 시트 도움말 | 날을 열면 이 시간이 깔려요. 이미 연 날은 그대로예요 | — |
| 시트 버튼 | 닫기 · 바꾸기 | — |

시각은 [writing.md](../../design-system/writing.md#숫자와-단위)대로 24시간제다.

## 모션

### 관리자 홈 모션

**등장 모션이 없다.** [motion.md](../../design-system/foundation/motion.md#자주-일어나는-것은-움직이지-않는다)대로다. 관리자가 매일 드나드는 화면이다.

**시트만 움직인다.** 기본값 시트가 아래에서 올라오고 `--duration-slow`다.

## 예외와 미정

### 안 담은 것

**가입 대기의 상세.** 줄만 세웠다. 누르면 가는 화면은 [members-pending.md](../../modules/account/screens/members-pending.md)다.

**관리자 공지 보내기, 알림 목록, 설정.** 이 화면의 나머지 자리들이다.

**관리자와 근무자 모드를 오가는 길.** 관리자도 근무자라 대시보드를 본다([dashboard.md](dashboard.md#안-담은-것)). 어디서 갈아타는지는 안 정했다.

### 규칙과 부딪힌 자리

**이 화면이 새로 부딪힌 자리는 없다.** 기본값 시트 뒤 덮개가 다크에서 밝아지는 문제는 [excuse.md](../../modules/attendance/screens/excuse.md#규칙과-부딪힌-자리)의 `bg.scrim` 제안이 이미 적었다 — 새로 제안하지 않고 그 제안에 얹는다.

### 아직 안 정한 것

임의로 채우지 않는다. 사람이 정하고 나서 이 절에서 뺀다.

지금은 없다. 가입 대기 줄을 눌렀을 때 가는 화면도 미정이 아니라 [members-pending.md](../../modules/account/screens/members-pending.md)에 있다.
