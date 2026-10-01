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

## 왜 안 드러났나

`useMonthAvailabilities`의 주석이 키를 **일부러** 나눠 쓴다고 적는다.

> 달력 칸의 신청 수, 날 상세의 근무 신청 줄, 모아보기 화면이 같은 `['availability', month]` 하나를 나눠 쓴다

그 셋은 전부 `getMonthAvailabilities`를 부르니 맞는 설계다. 나중에 선 `useMyAvailability`가 **같은 도메인이라 같은 키라고 읽고** 다른 `queryFn`을 달았다. 두 파일이 각자 맞는 말을 적고 있어서 리뷰가 한쪽만 보면 안 보인다.

키 상수가 `[도메인]`까지만 들고 범위는 호출부가 스프레드로 붙이는 꼴이라, **어느 범위가 이미 쓰였는지 한자리에서 볼 수 없는 것**이 바탕이다.

## 제안

**키와 `queryFn`을 한자리에서 짝지어 보이게 한다.** 캐시 키 팩토리(`fsd-read-write-layers` AC-03)가 그 자리다 — 범위마다 항목 하나면 같은 튜플을 두 번 쓰려는 것이 정의부에서 보인다.

고치는 쪽은 둘이다.

- **`['availability', month, 'mine']`로 가른다** — 접두사가 겹쳐 신청을 보내면 둘이 같이 낡는다. 지금 `useSubmitAvailability`가 `['availability']` 하나를 무효화하니 그 동작도 그대로다
- **`useMyAvailability`를 없애고** 모아보기 행에서 내 날짜를 뽑는다 — RLS가 근무자에게 제 행만 주니 같은 질의로 답이 나온다. 질의가 하나 줄지만 관리자는 전원 행을 받아 거르는 일이 화면에 생긴다

**키 문자열을 바꾸는 쪽이라 AC-03의 「한 글자도 안 바꾼다」와 부딪힌다.** 그 조항은 옮기는 작업이 캐시 동작을 흔들지 말라는 뜻이고, 이건 지금 동작이 틀린 자리다 — 묶음 3에서 같이 고치고 그 PR이 근거를 든다.
