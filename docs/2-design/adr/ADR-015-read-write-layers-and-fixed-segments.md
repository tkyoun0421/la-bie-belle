# ADR-015 — 층을 읽기와 쓰기로 가르고 세그먼트와 파일 이름을 고정한다

2026-10-01에 정했다. [ADR-001](ADR-001-fsd-layout-and-tdd-guard.md)의 「세그먼트」 절을 대체한다 — 그 문서의 나머지(레이어 다섯, 화면과 로직, 테스트 자리, 훅이 막는 것)는 그대로 산다. 파일 이름 규약은 지금 `CLAUDE.md`에만 있고 ADR이 없었다. 이 문서가 그 자리를 가진다.

## 결정

**층의 뜻을 읽기와 쓰기로 가른다.**

- `entities/` — queries와 모델과 제약. 이 도메인을 어떻게 읽고, 무엇이 참이고, 무엇이 금지인가
- `features/` — mutations의 use case. 누가 무엇을 바꾸나

**세그먼트는 다섯으로 고정한다.** 목록을 열어두지 않는다.

**파일 이름은 camelCase에 성격을 접미사로 단다.** kebab-case를 버린다.

## 왜 지금

ADR-001은 세그먼트를 「`types`, `components`, `hooks`, `actions`, `dals`, `models` 같은 이름을 쓰고, 목록은 열어둔다」로 뒀다. 새 성격이 필요하면 그 자리에서 만들라고 했다.

그 결과 **같은 성격이 슬라이스마다 다른 자리에 산다.**

- 데이터 접근이 둘로 갈렸다 — `entities/*/dals/` 일흔넷과 `features/stats/api/` 하나가 같은 일을 한다
- React 훅과 순수 계산이 한 폴더에 섞였다 — `features/*/model/`에 훅 쉰여덟과 순수 함수 서른넷이 나란히 있다
- 슬라이스 하나가 여러 가지를 말한다 — `features/schedule`에 훅 서른이 들어 있어 「이 슬라이스는 무엇을 하나」에 답할 수 없다
- 읽기와 쓰기가 층을 가로질러 흩어졌다 — `get-month-schedule.ts`는 `entities`에 있고 그것만 부르는 `useMonthSchedule.ts`는 `features`에 있어, 한 읽기를 고치려면 두 층을 왕복한다

세그먼트 이름을 고르는 일이 매번 판단이 되면 그 판단이 슬라이스마다 갈린다. 이름을 고정하고 판정 기준을 기계가 읽을 수 있게 적는다.

**파일 이름도 성격을 안 말한다.** `profile/model/`에 `can-save-display-name.ts`·`format-birth-date.ts`·`sort-members.ts`가 나란히 있는데 첫째는 업무 판정이고 나머지 둘은 꼴 바꾸기다. 이름만 보고는 어느 것이 업무 규칙인지 몰라, 규칙을 고칠 때 폴더를 다 열어야 한다. 성격을 접미사로 달면 그 질문이 파일 목록에서 끝난다.

## 읽기와 쓰기

읽기와 쓰기는 재사용의 폭이 다르다. 읽기는 여럿이 같은 것을 본다 — `useMonthSchedule`을 관리자 근무표와 근무자 근무표와 대시보드가 다 읽는다. 쓰기는 use case 하나에 묶인다 — `useAddSlot`은 관리자 근무표만 쓴다. 폭이 다른 둘을 한 층에 두면 재사용되는 것과 안 되는 것이 섞여, 슬라이스를 쪼갤 기준이 사라진다.

제약도 읽기 쪽이다. 「마지막 관리자는 역할을 못 내린다」(`is-last-admin`)와 「출근인가 지각인가」(`attendance-status`)는 그 도메인이 참이라고 하는 것이고, 쓰기 전에 읽어 판정한다.

**이 가름이 싸게 되는 까닭은 섞인 파일이 없어서다.**

| 센 것 | 읽기만 | 쓰기만 | 둘 다 | 손으로 판정 |
| --- | --- | --- | --- | --- |
| dal — `entities/*/dals/` | 24 | 49 | 0 | 1 |
| 훅 — `features/*/model/use*.ts` | 17 | 37 | 0 | 4 |

손으로 판정할 다섯은 이렇다 — `profile/dals/avatars-bucket.ts`는 버킷 주소를 읽고 파일을 올려 둘을 다 하고, 훅 넷(`useSavePushToken`·`usePayrollMonths`·`useRehearsalMonths`·`useScheduleMonths`)은 쿼리도 뮤테이션도 아니라 다른 훅을 조합하거나 효과만 낸다.

## 세그먼트 다섯

| 세그먼트 | 담는 것 | 판정 기준 | 서는 층 |
| --- | --- | --- | --- |
| `ui` | 받은 것을 그리는 `.tsx` | 계산·상태·통신이 없다 | screens · features · shared |
| `hooks` | React 훅 | `use`로 시작하고 React를 쓴다 | entities · features · shared |
| `api` | 통신 — 서버 함수·표·버킷·설정 | Supabase 클라이언트에 닿는다 | entities · features · shared |
| `model` | 도메인의 모양과 규칙 — 타입·검증·제약·전역 상태 | 그 도메인이 무엇이고 무엇이 참인지 말한다 | entities · features · screens |
| `utils` | 순수 도구 — 꼴 바꾸기·고르기·세기 | 업무 판정이 없고, 같은 입력에 늘 같은 값을 준다 | 전부 |

`shared/`는 슬라이스가 없어 세그먼트가 바로 온다.

**`model`과 `utils`는 판정하느냐로 갈린다.** `model`은 「이것이 허용인가」에 답하고 `utils`는 「이것을 저 꼴로」에 답한다. 「마지막 관리자는 역할을 못 내린다」는 `model`이고 「분을 1시간 30분으로」는 `utils`다. 업무 규칙이 `utils`에 숨는 것이 이 가름이 막는 일이라, 애매하면 `model`로 보낸다 — 거기 있는 것은 테스트가 업무 문장으로 읽히고, `utils`에 있는 것은 입출력 표로 읽힌다.

**`hooks`가 `entities`에도 선다.** 쿼리 훅은 읽기 쪽이라 entities가 가진다 — 그 도메인을 읽는 길이 dal과 훅 둘이고, 둘이 한 슬라이스에 있어야 한 쌍으로 고쳐진다.

**`api`를 `rpc`와 `from`으로 더 가르지 않는다.** 둘은 보안 축이 다르다 — `rpc()`는 서버 함수의 권한 검사를 타고 `from()`은 RLS만 탄다. 한 파일에 섞인 자리가 하나도 없어(49/25) 폴더로 가를 수도 있었지만, **폴더가 아니어도 그 축을 셀 수 있다.**

```
grep -rl "from(" src/entities/*/api src/features/*/api
```

「RLS가 유일한 방어인 자리」 스물다섯 개가 한 줄로 나온다. 보안 스캔과 사람 리뷰가 볼 자리를 좁히는 데는 그 줄로 충분하고, 세그먼트를 하나 늘리는 값보다 이름이 적은 값이 크다. 통신은 통신이고 그 안의 갈래는 코드가 말한다.

**캐시 키와 설정도 `api`다.** `query-keys`·`query-client`·`read-supabase-env`는 통신 계층의 약속이라 `shared/api`에 산다. 색·서체처럼 통신과 무관한 값은 `shared/utils`다.

**전역 상태는 `model`이다.** zustand store가 그 자리다 — ADR-001이 「계산, 상태 규칙, 통신은 전부 `.ts`로」라 적을 때 상태 규칙을 계산 쪽에 세웠다. `use`로 시작하는 store 훅은 `hooks`다.

## 파일 이름

**kebab-case를 버리고 camelCase로 간다.** `.ts`가 내놓는 것은 함수와 타입이고 코드에서 부르는 이름이 camelCase다 — `getMonthSchedule`을 `get-month-schedule.ts`에서 가져오면 import 줄에서 이름이 두 번 꼴을 바꾼다. 꼴을 하나로 맞추면 파일을 찾을 때 이름을 변환하지 않는다.

**케이스 충돌이 안 생기는 까닭은 확장자가 꼴을 가르기 때문이다.** ADR-001이 `.tsx`를 더미 UI로 못박아 PascalCase는 `.tsx`에만, camelCase는 `.ts`에만 산다 — `CheckIn.tsx`와 `checkIn.ts`는 소문자화해도 확장자가 달라 한 파일이 되지 않는다. 그 짝을 보는 검사는 보험으로 남긴다.

**성격은 접미사로 단다.** 세그먼트 폴더가 이미 성격을 말하지만 import 줄에는 폴더 이름이 잘려 보일 때가 많고, `model`은 한 폴더에 성격이 넷 산다.

| 접미사 | 사는 자리 | 담는 것 |
| --- | --- | --- |
| `[domain].type.ts` | `model` | 타입과 상수. 런타임에 아무것도 안 한다 |
| `[domain].schema.ts` | `model` | 바깥에서 들어온 값의 꼴 검증. API 응답·딥링크 파라미터·QR 문자열 |
| `[domain].policy.ts` | `model` | 업무 판정. 순수 함수여야 하고 사이드 이펙트가 없다 |
| `[domain].store.ts` | `model` | zustand store |
| `[domain].utils.ts` | `utils` | 그 도메인의 순수 도구 |
| `[action].api.ts` | `api` | 통신 하나 |
| `use[Action]Query.ts` | `hooks` | 읽기 훅 |
| `use[Action]Mutation.ts` | `hooks` | 쓰기 훅 |

**여덟 꼴에 안 맞는 파일은 접미사가 없다.** `shared/api/queryKeys.ts`처럼 통신 행위가 아니라 통신의 약속인 것, `shared/utils/`의 색 표처럼 도메인이 없는 것이 그렇다. 접미사는 성격이 섞이는 자리를 가르는 장치라, 섞일 것이 없으면 안 붙인다.

**`type`과 `schema`가 둘인 까닭은 사는 시간이 달라서다.** 타입은 컴파일 때 사라지고, 바깥에서 들어온 값은 런타임에 꼴을 확인해야 한다. 지금 `validateProfile`과 홀리데이 API 응답 파싱이 그 일을 손으로 하는데 둘이 다른 자리에 있다. 검증 라이브러리를 들이든 손으로 쓰든 자리는 `schema`다.

**`policy`는 순수다.** 통신도 시계도 난수도 못 쓴다 — 「지금 지각인가」를 판정하려면 시각을 받아야 하고 제가 읽어선 안 된다. 그래서 테스트가 입력만 주면 돌고, 같은 판정을 서버 함수가 SQL로 또 쓸 때 두 쪽을 같은 표로 맞출 수 있다.

**훅 이름에 `Query`와 `Mutation`을 박는다.** 파일 이름과 export 이름이 같아야 코드에서 파일로 바로 건너가니 함수 이름도 같이 바뀐다 — `useMonthSchedule`이 `useMonthScheduleQuery`가 된다. 호출부가 그 이름만 보고 읽기인지 쓰기인지 알고, 층의 뜻(entities는 읽기·features는 쓰기)이 import 줄에서 보인다.

**`ui`와 `screens`는 접미사가 없다.** `.tsx`가 곧 컴포넌트라 성격이 하나뿐이고, 이름은 PascalCase 그대로다. `src/app/`도 밖이다 — Expo Router가 파일 이름을 URL로 읽어 `check-in.tsx`가 `/check-in`이고 그 주소는 종이 QR에 실려 나간다.

**Supabase 클라이언트 타입은 `DB`다.** 데이터베이스의 약자라 두 글자가 다 대문자다. 약어가 이름 안에 올 때도 같다 — `words()`가 소문자 뒤의 대문자만 가르니 약어를 붙여 쓰면 camel 변환이 그 조각을 못 나눈다는 것은 알고 쓴다.

**ESLint 규칙 이름은 kebab으로 둔다.** `house/dumb-ui`는 파일 이름이 아니라 그 생태계의 식별자고, 소스의 `eslint-disable` 주석이 그 이름을 그대로 쓴다. 규칙 파일(`eslint-rules/dumbUi.mjs`)은 camel이고 등록 키는 kebab이다.

## 슬라이스를 쪼개는 기준

**`entities`는 도메인 하나다.** 그 도메인을 읽는 dal과 쿼리 훅과 제약이 한 슬라이스에 산다.

**`features`는 use case 하나다.** 기준은 「누가 무엇을 바꾸나」고, 그 쓰기를 하는 dal과 뮤테이션 훅이 한 슬라이스에 산다. entities와 같은 이름으로 쪼개지 않는다 — 그러면 features가 엔티티를 거울처럼 베낀 층이 되고, 층이 둘인 뜻이 사라진다.

**`screens`는 쪼개지 않는다.** ADR-001이 「슬라이스 이름은 라우트 이름과 같게 짓는다」로 정했고 라우트가 하나면 슬라이스도 하나다. 그 안을 `ui`와 `model`로 가르는 것이 할 수 있는 전부다.

## 집행

검사 여섯을 세운다. 폴더와 이름이 뜻을 가지면 그 뜻을 기계가 지킨다 — 안 그러면 다음 task가 아무 데나 넣고 폴더는 한 달 안에 뜻을 잃는다.

| 규칙 | 막는 것 | 지키는 것 | 보는 것 |
| --- | --- | --- | --- |
| `api/` 밖에서 Supabase 클라이언트 import 금지 | 통신이 `model`이나 `hooks`로 새기 | `api`가 통신의 유일한 문이라는 것 | lint 규칙 |
| `hooks/` 밖의 `use*` export 금지 | 훅이 `model`이나 `api`에 섞이기 | 세그먼트의 뜻 | lint 규칙 |
| `entities/`의 `useMutation` 금지 · `features/`의 `useQuery` 금지 | 층을 가로지르는 읽기·쓰기 | **층의 뜻** | lint 규칙 |
| `.policy.ts`에서 통신·시계·난수 금지 | 판정이 바깥을 읽기 | policy가 순수하다는 것 | lint 규칙 |
| 접미사가 사는 세그먼트와 맞는지 | `api/`의 `.policy.ts`처럼 어긋난 자리 | 접미사가 성격을 말한다는 것 | `tests/lint/fileNaming.ts` |
| 이름이 camelCase인지 | kebab이 다시 들어오기 | 꼴 하나 | `tests/lint/fileNaming.ts` |

셋째 줄이 이 ADR의 핵심을 지킨다. 첫 줄은 [ADR-003](ADR-003-supabase-and-integration-tests.md)의 「클라이언트는 `dals`에서만」을 새 이름으로 옮긴 것이다 — 세그먼트가 `api`로 바뀌었으니 그 규칙도 `api`를 가리킨다.

`fileNaming.ts`는 지금 kebab을 요구하는 자리라 그것을 camel로 바꾸고 접미사 검사를 더한다. 「훅 파일은 `use`로 시작한다」와 케이스 충돌 검사는 그대로 산다.

## 함께 정한 것

**캐시 키는 `shared/api/query-keys.ts` 한 자리다.** 쓰기 슬라이스가 성공한 뒤 낡게 할 키는 읽기 슬라이스의 것이고, `no-cross-slice-import`가 같은 층 슬라이스끼리 import를 막아 쓰기가 그 키에 닿을 수 없다. 키의 정본이 코드가 아니라 [runtime.md](../system/runtime.md)라고 이미 적혀 있고, 「어느 쓰기가 어느 읽기를 낡게 하나」는 슬라이스 하나가 아니라 앱 전체의 약속이다.

**옮기는 일은 `git mv`로 한다.** TDD 훅은 Write와 Edit만 보고 Bash를 안 본다([ADR-001](ADR-001-fsd-layout-and-tdd-guard.md)이 그 구멍을 알고 남겼다). 테스트를 같이 옮기면 짝이 유지되고, 파일 내용을 한 줄도 안 고치는 커밋이 되어 되돌리기가 revert 한 번이다.

**세그먼트끼리는 자유롭다.** 막히는 것은 슬라이스 경계 하나뿐이라, 세그먼트 고정은 import를 한 줄도 막지 않는다. 슬라이스 쪼개기만 캐시 키를 먼저 치운 뒤에 간다.

**통신 하나가 파일 하나다.** `api/`에 CRUD를 묶지 않는다 — `addSlot.api.ts`와 `removeSlot.api.ts`가 따로 선다. 지금 dal 일흔넷이 이미 그 꼴이라 바뀌는 것은 이름뿐이다. 묶으면 한 파일이 읽기와 쓰기를 같이 들어 층의 가름이 파일 안에서 무너진다.

**폴더를 미리 만들지 않는다.** ADR-001의 「슬라이스 안에 파일을 바로 두다가 같은 성격이 셋째로 생기면 그때 세그먼트 폴더로 묶는다」는 그대로 유효하다. 고정한 것은 이름이고, 언제 폴더를 만드는지는 안 바꿨다.

## 남는 위험

**`features`가 서버에 직접 닿는다.** 쓰는 dal이 features로 올라가면 그 층이 Supabase를 직접 부른다. entities를 거치지 않는 것이 FSD의 일반 관례와 다른데, 쓰기는 재사용되지 않아 거쳐 갈 자리가 없다. 재사용되는 쓰기가 생기면 그때 entities로 내린다.

**use case의 크기 기준이 없다.** 「누가 무엇을 바꾸나」로 가르면 dal 하나짜리 슬라이스가 생긴다(`qualification-grant`·`adjustment`·`holiday`). 작다고 묶으면 기준이 흐려지고, 안 묶으면 슬라이스가 많아진다. 지금은 안 묶는 쪽으로 갔다 — 쓰기가 늘 때 그 슬라이스가 자라는 것이 자연스럽다.

**이름 고정이 다음 성격을 막을 수 있다.** 다섯 밖의 성격이 실제로 필요해지면 이 문서를 고친다. 「그 자리에서 만든다」를 막은 것이 이 결정이고, 그래서 늘리는 일도 결정이어야 한다.

**rename 오백서른다섯 건이 이력을 끊는다.** `git mv`가 이름 변경을 기록하지만 내용까지 바뀐 커밋에 섞이면 git이 추적을 놓친다. 그래서 이름만 바꾸는 커밋과 import를 고치는 커밋을 가른다. 같은 기간에 다른 브랜치가 열려 있으면 충돌이 전면전이 되니 이 전환은 열린 브랜치가 없을 때 한 번에 간다.
