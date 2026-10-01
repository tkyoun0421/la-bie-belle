---
status: open
target: eslint-rules/
date: 2026-10-02
resolved:
---

# 재수출이 세그먼트 경계를 통째로 우회한다

공용 묶음이 `kstToday()`를 `shared/lib`으로 옮기려고 당기는 쪽을 셌더니, 화면 둘이 `model`을 거쳐 그것을 당기고 있었다.

```
src/screens/scheduleWorker/model/monthState.policy.ts:52
export { kstToday, shiftMonth, spellMonth } from "@/shared/utils/kstDate";

src/screens/adminHome/model/todayStatus.policy.ts:16
export { kstDateOf, kstToday, spellDate } from "@/shared/utils/kstDate";
```

`ScheduleWorkerScreen.tsx`와 `AdminHomeScreen.tsx`가 `@/screens/<슬라이스>/model/*.policy`에서 `kstToday`를 받는다. 화면은 `model`만 당기는 것처럼 보이고, `model`은 바깥을 읽는 손을 그대로 흘려보낸다.

## 왜 아무것도 안 울었나

세그먼트 경계를 보는 검사가 전부 **import 축**이다. `no-restricted-imports`도, 신설 예정인 `nativeSdkSegment.mjs`·`purePolicy.mjs`도 「이 파일이 무엇을 당기나」를 본다. `export { ... } from`은 당기는 문장이 아니라 내보내는 문장이라 그 그물에 안 걸린다.

그래서 재수출 한 줄이 층을 투명하게 만든다. `model`이 `lib`을 재수출하면 그 `model`을 당기는 모두가 `lib`을 당긴 것이 되는데, 어느 파일에도 그 import가 안 적혀 있다. AC-12가 「`.tsx`가 `api`를 당기는 자리 0」을 세워도 `model`이 `api`를 재수출하면 그 수가 0으로 보인다.

## 지금 한 것

재수출 둘에서 `kstToday`를 떼고 화면 둘이 `@/shared/lib/kstToday.lib`에서 직접 당기게 했다. 손으로 찾았다 — 옮길 파일의 당김을 세다가 걸렸고, 안 옮겼으면 안 봤다.

## 뒤에 더 나왔다

급여 묶음에서 같은 꼴을 둘 더 걷었다. `screens/wages`의 `canResetToDefault.policy.ts`와 `followerCount.utils.ts`가 `export type { WageRateRow };`로 **DTO를 재수출**하고 있었고, 그 별칭을 테스트 둘이 당겼다. 화면 쪽에서 보면 `model`에서 받은 타입인데 실물은 DB 열 이름이다 — 「`.dto.ts`를 `api/` 밖에서 import 금지」가 서도 이 길은 안 막힌다. 떼어내고 테스트가 `.dto.ts`에서 직접 받게 했다.

**남은 재수출은 일곱이고 전부 순수 중계다.** `POSITION_ORDER`·`Position`·`kstDateOf`·`lastDateOfMonth`·`shiftMonth`·`spellMonth`·`spellDate`를 `screens`의 `model`·`utils` 여섯이 중계한다. 부작용도 DB 열 이름도 아니라 해롭지 않지만, 아래 「`model`·`utils`·`consts`는 재수출 금지」를 그대로 켜면 이 일곱도 걷어야 한다 — 켤 때 그 수가 비용이다.

## 기계가 대신할 수 있나

할 수 있다. 세그먼트 규칙마다 import 축 옆에 `ExportNamedDeclaration`에 `source`가 있는 꼴을 같은 판정에 물리면 된다 — ESLint가 그 노드를 그대로 준다.

더 싼 판정이 하나 더 있다. **`model`·`utils`·`consts`는 재수출을 아예 금지**하는 것이다. 순수한 자리가 남의 이름을 중계할 이유가 없고, 지금 저장소에서 그 꼴이 둘뿐이라 금지해도 고칠 것이 없다. `api`의 `database.ts`가 `databaseTypes`의 `Database`를 받아 `DB`로 내보내는 것은 이름을 바꿔 좁히는 일이라 다른 축이다.

AC-08이 규칙 열하나를 세울 때 이 축을 같이 물린다.
