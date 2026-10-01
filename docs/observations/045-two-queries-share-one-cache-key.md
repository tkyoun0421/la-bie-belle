---
status: open
target: src/features/schedule/model/useMyAvailability.ts
date: 2026-10-01
resolved:
---

# 모양이 다른 질의 둘이 캐시 키 하나를 나눠 쓴다

## 일

캐시 키를 팩토리로 모으려고 전수를 세다 보니 `['availability', month]`를 쓰는 자리가 둘이었다.

```ts
// useMyAvailability — 내가 낸 날짜들
queryKey: [...AVAILABILITY_KEY, month],
queryFn: () => getMyAvailability(client, month),   // string[]

// useMonthAvailabilities — 전원 신청을 이름과 함께
queryKey: [...AVAILABILITY_KEY, month],
queryFn: () => getMonthAvailabilities(client, month),   // AvailabilityRow[]
```

TanStack Query는 키로 질의를 같다고 본다. 둘이 한 세션에서 돌면 **먼저 캐시에 든 쪽이 이긴다** — 근무자 화면의 `myDates`가 `AvailabilityRow[]`를 받거나, 모아보기 화면이 `string[]`을 받는다. 타입은 각 훅이 자기 `queryFn`의 반환으로 좁히니 `tsc`가 안 막는다.

호출부는 갈려 있다 — `screens/scheduleWorker` 하나와 `screens/scheduleAdmin`·`screens/applications` 둘이다. **관리자가 제 근무도 보는 사람이면** 두 화면을 30초(`staleTime`) 안에 오가며 밟는다.

## 정본은 답을 들고 있었다

[schedule/design.md](../2-design/modules/schedule/design.md#소유-데이터)의 키 목록에 그 가름이 적혀 있다.

> `['availability', 'YYYY-MM']` — 본인 신청. 관리자의 신청 현황은 `['availability', 'YYYY-MM', 'all']`이다

바로 아래 리허설 줄이 같은 말을 하고 **코드는 리허설만 그대로 지켰다** — `useMyRehearsals`가 맨 키를, `useAllRehearsals`가 `'all'`을 쓴다. 근무 신청은 둘 다 맨 키를 쓴다.

## 왜 안 드러났나

`useMonthAvailabilities`의 주석이 키를 **일부러** 나눠 쓴다고 적는다.

> 달력 칸의 신청 수, 날 상세의 근무 신청 줄, 모아보기 화면이 같은 `['availability', month]` 하나를 나눠 쓴다

그 셋은 전부 `getMonthAvailabilities`를 부르니 그 말 자체는 맞다. 나중에 선 `useMyAvailability`가 **같은 도메인이라 같은 키라고 읽고** 다른 `queryFn`을 달았다. 두 파일이 각자 맞는 말을 적고 있어서 리뷰가 한쪽만 보면 안 보인다.

키 상수가 `[도메인]`까지만 들고 범위는 호출부가 스프레드로 붙이는 꼴이라, **어느 범위가 이미 쓰였는지 한자리에서 볼 수 없는 것**이 바탕이다. 정본의 키 목록과 코드를 맞추는 검사도 없다.

## 고친 것

**키와 `queryFn`을 한자리에서 짝지어 보이게 했다.** 캐시 키 팩토리(`fsd-read-write-layers` AC-03)가 그 자리고, 범위마다 항목 하나라 같은 튜플을 두 번 쓰려는 것이 정의부에서 보인다.

`useMonthAvailabilities`를 `['availability', month, 'all']`로 내렸다 — 정본이 정한 방향이다. 접두사가 겹쳐 `useSubmitAvailability`가 `['availability']` 하나를 무효화하는 동작도 그대로다.

**처음에는 근무자 쪽에 `'mine'` 꼬리를 붙였다.** 겹침만 보고 고쳤더니 정본과 반대 방향이 됐고, 영향 문서를 세다가 design.md의 그 줄을 읽고 되돌렸다 — 리허설과 꼴이 어긋나는 것도 그때 보였다.

## 남는 위험

**정본의 키 목록과 팩토리를 맞추는 검사가 없다.** 영역 design 넷이 키를 적고 팩토리가 그것을 코드로 든다 — 두 자리가 어긋나도 아무것도 안 깨진다. `tests/lint/`의 오류 코드 대조와 같은 꼴의 검사를 세울 수 있고, `fsd-read-write-layers` AC-08에 「캐시 키 배열 리터럴 금지」가 이미 있으니 그 옆자리다.
