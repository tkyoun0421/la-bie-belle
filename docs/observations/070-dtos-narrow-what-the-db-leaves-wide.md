---
status: open
target: "제안: dto-derives-from-generated-types"
date: 2026-10-11
---

# DTO가 DB보다 좁게 선언하고 그 사이에 검증이 없다

생성된 DB 타입(`src/shared/api/databaseTypes.ts`, 1609줄)과 손으로 쓴 DTO 29개를 AST로 대조했다. **테이블을 짚을 수 있는 열둘 가운데 열은 DB와 꼴이 정확히 같고 둘이 어긋난다.**

| DTO | 칸 | 손이 적은 것 | DB가 주는 것 |
| --- | --- | --- | --- |
| `HallDefaultsRow` | `default_slots` | `HallSlot[]` | `Json` |
| `NotificationRow` | `kind` | `NotificationKind` | `string` |
| 같은 자리 | `payload` | `NotificationPayload` | `Json` |

**어긋남의 방향이 셋 다 같다** — DTO가 DB보다 좁다. `jsonb`와 제약 없는 `text`를 받아 「이 모양이다」라고 적는데 **그 사이에 검증하는 자리가 없다.** 그 행이 실제로 그 모양인지는 쓰는 쪽이 지켜 왔을 뿐이고, 타입은 그것을 보장하지 못한다.

`getHallDefaults.api.ts:16`의 `as HallSlot[]`과 `destination.policy.ts:69`·`title.utils.ts:133`의 `as NotificationKind`가 **그 어긋남이 밖으로 나온 자리다.** `as`를 지우는 것으로는 안 끝난다 — 지워도 DTO가 여전히 좁게 적고 있다.

`toNotificationDestination`은 이미 모르는 `kind`를 견딘다(`point == null ? null : point(row.payload)`). 입구 타입이 `kind: string`으로 넓게 서 있고 **표에서 못 찾으면 널을 낸다** — 그 자리는 검증이 이미 있다. 나머지 둘은 없다.

**생성된 타입을 쓰는 자리가 `src/shared/api/database.ts` 하나다.** DTO 29개가 전부 손으로 쓴 것이라 **DB의 칸 이름이 바뀌어도 typecheck가 안 깨진다.** 지금 열이 맞는 것은 손으로 맞춰 왔기 때문이고 기계가 지킨 것이 아니다.

**열일곱은 테이블을 짚을 수 없었다** — 뷰와 RPC와 조인의 결과를 받는 자리다. 그쪽은 생성된 타입으로 대체할 수도 없으니 **손으로 쓰는 것이 맞는 자리고**, 어긋남을 기계가 볼 길이 없다.

판정이 필요한 것은 둘이다. **입구에서 `jsonb`를 검증할 것인가**, 그리고 **테이블을 그대로 읽는 자리의 DTO를 생성된 타입에서 끌어낼 것인가**. 둘 다 동작이 바뀔 수 있어 따로 선다.

**세는 법.** DTO 이름만으로 테이블을 짚으면 안 된다 — 컬럼 이름이 겹치는 테이블이 여럿이라 `QualificationRow`(`qualifications`를 읽는다)가 `assignments`에 잘못 붙어 거짓 어긋남 둘이 나왔다. 같은 폴더의 `.api.ts`에서 `.from("…")`을 읽어 **그 테이블만** 보면 사라진다.
