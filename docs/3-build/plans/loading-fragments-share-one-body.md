# 글자까지 같은 본문이 한 자리로 모인다

감사 축 ⑤가 함수 본문을 해시해 **글자까지 같은 여덟 집단**을 찾았다. 그 가운데 `positionRank`는 `rule-15-blocked-functions-to-model`이 들고, 나머지 일곱을 이 task가 한 자리로 모은다. 그린 것과 계산한 값은 안 바뀐다.

## 입력 명세·기준

자리는 [감사](../../proposals/post-refactor-audit.md)의 「글자까지 같은 여덟」이다. 상태 그림의 자리는 [ADR-016](../../2-design/adr/ADR-016-fragments-own-their-data.md)이 정했다 — 그림은 슬라이스 `ui`에 두는데 까닭이 「문안이 화면마다 달라서」다. **Loading에는 문안이 없다.**

## 판정 — 묻지 말고 이 꼴로 쓴다

**Loading 아홉은 `shared/ui`의 조각 하나로 모은다.** 집단 셋의 본문 차이는 감싸는 것(`Card`·`View`·없음)과 머리 줄 하나다. `shared/ui/SkeletonRows.tsx`가 `rows`(줄 수)와 감쌈 꼴을 props로 받고, 아홉 `*Loading.tsx`는 지우고 부르던 자리가 `SkeletonRows`를 직접 부른다. 줄 수는 지금 각 슬라이스 `consts`의 `SKELETON_ROWS`를 그대로 넘긴다 — 슬라이스마다 다를 수 있다.

**Failed 여덟은 안 모은다.** 문안이 화면마다 다르고 ADR-016의 까닭이 그대로 산다. 꼴만 같은 것은 중복이 아니다.

**같은 함수 넷은 한쪽으로 합친다.** 남는 쪽은 더 아래 층·더 넓게 쓰이는 쪽이다.

| 둘 | 남는 쪽 |
| --- | --- |
| `adminAttendanceLine`·`monthAttendanceLine` (`features/stats/utils`) | `monthAttendanceLine.utils.ts` |
| `adminAttendanceShares`·`attendanceRatioShares` (`features/stats/utils`) | `attendanceShares.utils.ts` |
| `formatBareDate`(`entities/schedule/utils`)·`bareDate`(`entities/workRequest/utils`) | 층이 같아 서로 못 본다(규칙 3) — `shared/utils/kstDate.ts`로 내린다 |
| `minutesOfClock`(`entities/rehearsal/utils`·`features/payrollCompute/model`) | `entities`가 `features`를 못 보니 `entities/rehearsal/utils` 쪽을 `shared/utils`로 내리고 둘 다 거기서 당긴다 |

**지우는 쪽의 `it`은 남는 쪽 짝으로 옮긴다** — 단언이 같으면 하나만 남긴다.

## 완료 조건

- **AC-01** 감사의 해시 셈(글자 그대로)을 다시 돌려 `positionRank` 한 집단 말고 0이다
- **AC-02** Loading을 쓰던 화면의 그린 나무가 그대로다 — 각 화면 조각 테스트가 초록이고, `SkeletonRows`의 짝이 감쌈 꼴 셋과 줄 수를 잰다
- **AC-03** 합친 함수의 단언이 하나도 안 바뀐다
- **AC-04** `pnpm lint`·`pnpm typecheck`·`pnpm test` 초록

## 리스크

**`shared/utils`로 내리는 함수 둘에 규칙 15가 짝을 요구한다** — 짝을 먼저 옮긴다. `shared/utils`는 `FOLDERS`에 없다.

**`features/stats/utils/chartValues.utils.ts`는 `api-exports-only-transport`가 같은 시기에 만진다** — 이 task는 그 파일을 안 건드린다.
