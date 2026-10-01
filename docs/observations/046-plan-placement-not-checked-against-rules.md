---
status: open
target: docs/3-build/plans/fsd-read-write-layers.md
date: 2026-10-02
resolved:
---

# 계획이 정한 자리를 그 자리를 막는 규칙에 대보지 않았다

## 일

`fsd-read-write-layers`가 `features/stats/api/useStatsQueries.ts`의 집을 두 번 정했고 두 번 다 틀렸다.

- AC-04(첫 판) — 「`api/`의 모든 파일에 `.api` 접미사를 붙인다」. 그러면 쿼리 훅에 `.api`가 달린다
- AC-04(고친 판)·AC-05 — 「`entities/stats/hooks/`로 내린다」. 그 파일은 `entities`의 schedule·payroll·attendance 셋을 함께 import해 `house/no-cross-slice-import`에 걸린다

둘째는 묶음 5를 짜면서 그 파일을 열어 import를 세다가 보였다. 규칙은 이미 저장소에 서 있었고 `pnpm lint` 한 번이면 드러났을 것이다 — 계획을 쓸 때 **규칙에 대보지 않고 분류만 보고 자리를 정했다.**

## 왜 둘 다 같은 파일인가

그 파일은 저장소에서 유일하게 **여러 도메인을 함께 읽는 훅 묶음**이다. 다른 쿼리 훅 스물은 전부 `entities` 한 도메인과 `shared`만 당긴다.

```
$ 쿼리 훅마다 당기는 entities 슬라이스
useQrCode            @/entities/attendance
useMembers           @/entities/profile
...                  (스물이 다 하나씩)
useStatsQueries      @/entities/attendance, @/entities/payroll, @/entities/schedule
```

분류(「쿼리냐 뮤테이션이냐」)로 자리를 정하는 규칙이 이 파일에서만 답을 못 낸다. 계획은 전수를 세어 「쿼리 17 · 뮤테이션 37 · 손 판정 4」를 적었는데, **센 축이 분류뿐이라 의존 방향은 세지 않았다.**

## 고친 것

파일을 넷으로 갈랐다. 셋은 제 도메인의 `entities/<도메인>/hooks/`로 가고, 두 도메인을 함께 쥐는 `useAttendanceMonths`만 위층에 남아 아래층 둘을 불러 달마다 맞춘다 — 제 `useQuery`가 없어 AC-08의 「`features/`에서 `useQuery` 금지」가 그대로 선다.

## 남는 위험

**계획의 자리 배정을 기계가 대보지 않는다.** 묶음 여덞이 파일 수백 개의 집을 정하는데, 그 자리가 `no-cross-slice-import`·`no-restricted-imports`와 맞는지는 옮긴 뒤 `pnpm lint`가 처음 말해준다. 같은 묶음에서 `removePushToken`도 같은 꼴로 걸렸다 — 부르는 쪽이 없다고 봐 `entities`에 남겼는데 짝 테스트가 `features`의 함수를 쓴다.

계획 단계에서 자리를 대보는 길이 있다 — 옮길 목록을 받아 「그 자리에서 이 파일의 import가 규칙에 걸리나」를 묻는 검사다. 이 task의 남은 묶음 셋(AC-06·07·08)이 같은 종류의 배정을 더 하고, AC-07은 슬라이스를 열여섯·스물로 쪼개 의존 방향이 가장 많이 흔들리는 자리다.
