# ADR-015 — 층을 읽기와 쓰기로 가르고 세그먼트와 파일 이름을 고정한다

2026-10-01에 정했다. [ADR-001](ADR-001-fsd-layout-and-tdd-guard.md)의 「세그먼트」 절을 대체한다 — 그 문서의 나머지(레이어 다섯, 화면과 로직, 테스트 자리, 훅이 막는 것)는 그대로 산다. 파일 이름 규약은 지금 `CLAUDE.md`에만 있고 ADR이 없었다. 이 문서가 그 자리를 가진다.

## 결정

**층의 뜻을 읽기와 쓰기로 가른다.**

- `entities/` — queries와 모델과 제약. 이 도메인을 어떻게 읽고, 무엇이 참이고, 무엇이 금지인가
- `features/` — mutations의 use case. 누가 무엇을 바꾸나

**세그먼트는 열로 고정한다.** 목록을 열어두지 않는다.

**계층을 셋으로 보고 역할을 넷으로 본다.** presentation · logic · db가 계층이고 presentation · controller · service · repository가 역할이다. 세그먼트가 그 자리를 가진다.

**파일 이름은 camelCase에 성격을 접미사로 단다.** kebab-case를 버린다.

## 왜 지금

ADR-001은 세그먼트를 「`types`, `components`, `hooks`, `actions`, `dals`, `models` 같은 이름을 쓰고, 목록은 열어둔다」로 뒀다. 새 성격이 필요하면 그 자리에서 만들라고 했다.

그 결과 **같은 성격이 슬라이스마다 다른 자리에 산다.**

- 데이터 접근이 둘로 갈렸다 — `entities/*/dals/` 일흔넷과 `features/stats/api/` 하나가 같은 일을 한다
- React 훅과 순수 계산이 한 폴더에 섞였다 — `features/*/model/`에 훅 쉰여덟과 순수 함수 서른넷이 나란히 있다
- 슬라이스 하나가 여러 가지를 말한다 — `features/schedule`에 훅 서른이 들어 있어 「이 슬라이스는 무엇을 하나」에 답할 수 없다
- 읽기와 쓰기가 층을 가로질러 흩어졌다 — `getMonthSchedule.ts`는 `entities`에 있고 그것만 부르는 `useMonthSchedule.ts`는 `features`에 있어, 한 읽기를 고치려면 두 층을 왕복한다

세그먼트 이름을 고르는 일이 매번 판단이 되면 그 판단이 슬라이스마다 갈린다. 이름을 고정하고 판정 기준을 기계가 읽을 수 있게 적는다.

**파일 이름도 성격을 안 말한다.** `profile/model/`에 `canSaveDisplayName.ts`·`formatBirthDate.ts`·`sortMembers.ts`가 나란히 있는데 첫째는 업무 판정이고 나머지 둘은 꼴 바꾸기다. 이름만 보고는 어느 것이 업무 규칙인지 몰라, 규칙을 고칠 때 폴더를 다 열어야 한다. 성격을 접미사로 달면 그 질문이 파일 목록에서 끝난다.

## 읽기와 쓰기

읽기와 쓰기는 재사용의 폭이 다르다. 읽기는 여럿이 같은 것을 본다 — `useMonthSchedule`을 관리자 근무표와 근무자 근무표와 대시보드가 다 읽는다. 쓰기는 use case 하나에 묶인다 — `useAddSlot`은 관리자 근무표만 쓴다. 폭이 다른 둘을 한 층에 두면 재사용되는 것과 안 되는 것이 섞여, 슬라이스를 쪼갤 기준이 사라진다.

제약도 읽기 쪽이다. 「마지막 관리자는 역할을 못 내린다」(`is-last-admin`)와 「출근인가 지각인가」(`attendance-status`)는 그 도메인이 참이라고 하는 것이고, 쓰기 전에 읽어 판정한다.

**도메인 둘 이상을 읽는 것은 읽기라도 `features`에 산다.** `entities` 슬라이스는 도메인 하나고 같은 층 슬라이스끼리는 서로를 못 부른다 — 근무와 근태를 함께 읽는 질의, 근무·근태·리허설을 합쳐 급여를 내는 계산, 프로필을 읽어 진입을 판정하는 사슬은 `entities` 어디에도 앉을 자리가 없다. 조립은 위층 일이고, `features`가 그 위층이다. 그래서 `features`의 뜻은 「쓰기 use case」에 「도메인을 가로지르는 읽기」가 더해진다.

같은 함수를 `screens` 둘로 올리면 사본이 둘 생기고(`screens` 슬라이스끼리도 서로를 못 부른다) `shared`로 올리면 도메인이 없다는 전제가 깨진다. 그 둘보다 `features`가 싸다 — 슬라이스 이름이 「무엇을 합치나」를 말한다.

**그래서 `features`에 쓰기가 없는 슬라이스가 있을 수 있다.** `features/stats`가 그렇다. 통계는 바꾸는 것이 하나도 없고 근무·근태·급여를 합쳐 읽기만 한다.

**이 가름이 싸게 되는 까닭은 섞인 파일이 없어서다.**

| 센 것 | 읽기만 | 쓰기만 | 둘 다 | 손으로 판정 |
| --- | --- | --- | --- | --- |
| dal — `entities/*/dals/` | 24 | 49 | 0 | 1 |
| 훅 — `features/*/model/use*.ts` | 17 | 37 | 0 | 4 |

손으로 판정할 다섯은 이렇다 — `profile/dals/avatarsBucket.ts`는 버킷 주소를 읽고 파일을 올려 둘을 다 하고, 훅 넷(`useSavePushToken`·`usePayrollMonths`·`useRehearsalMonths`·`useScheduleMonths`)은 쿼리도 뮤테이션도 아니라 다른 훅을 조합하거나 효과만 낸다.

## 계층 셋과 역할 넷

층이 읽기와 쓰기를 가르는 축이라면, 세그먼트는 **무엇을 아는가**를 가르는 축이다.

| 계층 | 세그먼트 | 아는 것 | 모르는 것 |
| --- | --- | --- | --- |
| presentation | `ui` | props, 자기 안의 UI 상태 | 통신 · 업무 규칙 · 캐시 · 저장소 |
| logic | `hooks` · `services` · `stores` · `model` · `utils` · `consts` · `config` · `lib` | 도메인 모델 · 업무 규칙 · 어떤 service가 있나 | DB 열 이름 · 화면이 어떻게 생겼나 |
| db | `api` | 표·서버 함수·버킷 이름 · DB 열 이름 | 업무 판정 · 화면 · 캐시 정책 |

그 안에서 역할 넷이 파일 꼴을 받는다.

| 역할 | 파일 꼴 | 하는 일 |
| --- | --- | --- |
| presentation | `ui/*.tsx` | 그린다 |
| controller | `hooks/use<조각>.ts` | 조각 하나의 교통정리 — 어떤 입력에 어떤 service를 부르고, 결과를 그릴 꼴로. 화면도 조각의 하나다 |
| service | `services/use<Action>Query.ts` · `use<Action>Mutation.ts` · `stores/*` | repository를 부르고 결과를 해석하고 캐시를 정리한다 |
| repository | `api/<action>.api.ts` | 쿼리 한 번 |

**흐름은 위에서 아래로만 간다.**

```
ui/MembersPendingScreen.tsx                    presentation
 └─ hooks/useMembersPendingScreen.ts           controller
      ├─ services/useDecideMemberMutation.ts   service
      │    ├─ api/approveMember.api.ts          repository
      │    │    └─ api/member.dto.ts             DB 계약 — 여기까지만
      │    ├─ utils/member.mapper.ts            DTO를 도메인 모양으로
      │    └─ model/decision.policy.ts          판정 (순수)
      ├─ stores/sheet.context.ts                공유 상태
      └─ model/membersPending.reducer.ts        상태 전이 (순수)
```

**repository와 service를 가르는 축은 「저장소에 몇 번 닿나」다.** `.api.ts`는 한 번만 닿는다 — 지금 통신 백일흔둘 전부가 그 꼴이고 두 번 이상 닿는 파일이 하나도 없다. 조립이 필요하면 service가 repository를 여럿 부른다.

**controller가 비어 있던 자리다.** 세그먼트 여덞에 그 이름이 없어 화면 파일이 그 일을 겸했다 — `.tsx` 마흔넷이 상태·효과를 들고, 스물여섯이 repository를 직접 당기고, 아흔여섯이 service를 controller 없이 부른다. `ui`가 `hooks`를 당기는 자리는 **셋**뿐이다.

## 세그먼트 열

| 세그먼트 | 담는 것 | 판정 기준 | 서는 층 |
| --- | --- | --- | --- |
| `ui` | 받은 것을 그리는 `.tsx` | 업무 계산·통신이 없다. 상태는 UI를 담당할 때만 | 전부 |
| `hooks` | **controller** — 화면 하나의 교통정리 · UI 훅 | React를 쓰는데 통신도 전역 상태도 아니다 | 전부 |
| `services` | **service** — Query · Mutation | 통신을 부르고 캐시를 정한다 | entities · features · shared |
| `stores` | 전역 상태 — zustand · Context | 하위트리나 앱 전체가 나눠 쓰는 상태를 든다 | 전부 |
| `api` | **repository** — 통신 하나와 그 계약 | Supabase 클라이언트의 표·함수에 닿는다 | entities · features · shared |
| `model` | 도메인의 모양과 규칙 — 타입·검증·판정·전역 상태 | 그 도메인이 무엇이고 무엇이 참인지 말한다 | 전부 |
| `consts` | 정해진 값 | 코드가 고쳐 쓰지 않고, 환경이 바뀌어도 안 바뀐다 | 전부 |
| `config` | 환경이 주는 값 | 환경이 바뀌면 값이 바뀐다 | 전부 |
| `lib` | 부작용을 내는 손 | 순수하지 않고, 통신도 React 훅도 아니다 | 전부 |
| `utils` | 순수 도구 — 꼴 바꾸기·고르기·세기 | 업무 판정이 없고, 같은 입력에 늘 같은 값을 준다 | 전부 |

**열이 전부다.** `services`와 `stores`가 여덞에 더해졌다 — 앞선 판은 그 둘을 `hooks`와 `model`에 넣었는데 `hooks` 예순다섯 중 예순둘이 Query·Mutation이라 그 폴더가 사실상 `services`였고 이름이 그걸 안 말했다. 그리고 `hooks`에 controller가 들어오면 같은 이름 폴더에 역할 둘이 층으로만 갈린다. zustand store 둘은 자리가 갈려 있었다 — 하나는 `model/clock.store.ts`, 하나는 `hooks/useTheme.ts`고 「`use*`로 불리는 store는 부르는 이름이 이긴다」가 그 긴장을 봉합하고 있었다. `stores`가 서면 봉합이 필요 없다.

`shared/`는 슬라이스가 없어 세그먼트가 바로 온다.

**이 목록도 닫혀 있다.** 여덟이 전부고 새 이름은 ADR을 고쳐야 생긴다. 여는 값이 큰 것은 앞선 판이 겪었다 — ADR-001이 「목록은 열어둔다」로 뒀더니 같은 성격이 슬라이스마다 다른 자리에 살아 `dals` 일흔넷과 `api` 하나가 같은 일을 했다. 이름을 여는 것과 목록을 여는 것은 다르다.

**`services`와 `hooks`는 통신을 아느냐로 갈린다.** `services`는 `useQuery`·`useMutation`을 부르고 캐시 키를 정한다. `hooks`는 그것들을 모아 화면 하나가 쓸 꼴로 내놓거나(controller) UI 동작을 든다. 화면이 두 service를 쓰면 그것을 묶는 자리가 `hooks`고, 그 묶음이 통신을 새로 부르면 `services`로 내려가야 한다.

**`stores`와 `model`은 누가 읽느냐로 갈린다.** `model`의 타입과 판정은 부르는 쪽이 값을 들고 오고, `stores`는 제가 값을 들고 여럿에게 나눠 준다. 한 화면 안에서만 쓰는 상태는 `stores`가 아니라 controller의 `useState`나 `model`의 `.reducer.ts`다.

**`model`과 `utils`는 판정하느냐로 갈린다.** `model`은 「이것이 허용인가」에 답하고 `utils`는 「이것을 저 꼴로」에 답한다. 「마지막 관리자는 역할을 못 내린다」는 `model`이고 「분을 1시간 30분으로」는 `utils`다. 업무 규칙이 `utils`에 숨는 것이 이 가름이 막는 일이라, 애매하면 `model`로 보낸다 — 거기 있는 것은 테스트가 업무 문장으로 읽히고, `utils`에 있는 것은 입출력 표로 읽힌다.

**`consts`와 `config`는 값이 바뀌는 까닭으로 갈린다.** 지각 유예 10분은 업무가 정해 `consts`고, Supabase 주소는 환경이 정해 `config`다. 스토리지 키(`THEME_STORAGE_KEY`)는 `consts`다 — 어느 기계에서 돌든 같은 글자다. 판정 질문은 「개발과 운영에서 값이 다른가」고, 다르면 `config`다.

**`consts`가 열려 `[domain].type.ts`는 타입만 든다.** 앞선 판은 그 접미사가 「타입과 상수」를 담게 뒀는데, 상수가 제 세그먼트를 얻으면 한 파일이 두 성격을 드는 자리가 아니게 된다. 업무 상수가 `model/`에 숨어 「이 도메인의 규칙 숫자가 무엇인가」에 답하려면 타입 파일을 열어야 했던 것이 그 결정이 남긴 자리다.

**`lib`은 「순수하지 않은 손」이고 그것이 이름이 말하는 전부다.** 앞선 판이 `shared/lib`을 해체한 까닭은 그 폴더가 **아무 성격도 말하지 않았기 때문**이지 폴더가 남아서가 아니었다 — 통신과 훅과 순수 함수가 한 자리에 섞여 있었다. 지금 `lib`은 판정 기준을 가진다: **부작용을 내는데 통신도 React 훅도 아닌 것.** OS·플랫폼 SDK를 부르고, 바깥 저장소를 읽고 쓰고, 세션을 조작하고, 제가 시계를 읽는 자리다.

**`lib`과 `api`가 갈리는 축은 「무엇에 닿나」다.** `api`는 Supabase의 표와 서버 함수와 버킷에 닿는다. `supabase.auth.signOut()`은 같은 클라이언트를 쓰지만 표도 함수도 아니라 세션 조작이고, 그래서 `lib`이다 — 캐시 키로 낡게 할 것이 없고 RLS도 안 탄다.

**`lib`이 선 뒤에도 `policy`는 순수하다.** 「지금 지각인가」가 시각을 인자로 받는 것은 그대로다. `lib`은 그 시각을 **읽어 주는** 자리고, 판정은 받아서 한다 — 둘이 한 파일에 있으면 테스트가 시계를 흉내야 한다.

**`hooks`가 모든 층에 선다.** `screens`에도 선다 — ADR-001이 「계산, 상태 규칙, 통신은 전부 `.ts`로」라 적었는데 `screens`에 훅의 집이 없어 `useState`와 `useEffect`가 `.tsx`에 남았다. 화면 하나가 `screens/<슬라이스>/hooks/use<화면>.ts`를 갖고 `.tsx`는 그것이 돌려준 것을 그린다.

**`hooks`가 `entities`에도 선다.** 쿼리 훅은 읽기 쪽이라 entities가 가진다 — 그 도메인을 읽는 길이 dal과 훅 둘이고, 둘이 한 슬라이스에 있어야 한 쌍으로 고쳐진다.

**`api`를 `rpc`와 `from`으로 더 가르지 않는다.** 둘은 보안 축이 다르다 — `rpc()`는 서버 함수의 권한 검사를 타고 `from()`은 RLS만 탄다. 한 파일에 섞인 자리가 하나도 없어(49/25) 폴더로 가를 수도 있었지만, **폴더가 아니어도 그 축을 셀 수 있다.**

```
grep -rl "from(" src/entities/*/api src/features/*/api
```

「RLS가 유일한 방어인 자리」 스물다섯 개가 한 줄로 나온다. 보안 스캔과 사람 리뷰가 볼 자리를 좁히는 데는 그 줄로 충분하고, 세그먼트를 하나 늘리는 값보다 이름이 적은 값이 크다. 통신은 통신이고 그 안의 갈래는 코드가 말한다.

**캐시 키는 `api`고 설정은 `config`다.** `queryKeys`·`queryClient`는 통신 계층의 약속이라 `shared/api`에 산다. `readSupabaseEnv`는 앞선 판이 같이 뒀는데 그것이 읽는 것은 환경 변수라 `shared/config`로 간다 — 통신의 약속이 아니라 통신이 붙을 주소다. 색·서체처럼 통신과 무관한 값은 `shared/utils`다.

**전역 상태는 `model`이다.** zustand store가 그 자리다 — ADR-001이 「계산, 상태 규칙, 통신은 전부 `.ts`로」라 적을 때 상태 규칙을 계산 쪽에 세웠다. `use`로 시작하는 store 훅은 `hooks`다.

## 파일 이름

**kebab-case를 버리고 camelCase로 간다.** `.ts`가 내놓는 것은 함수와 타입이고 코드에서 부르는 이름이 camelCase다 — `getMonthSchedule`을 `getMonthSchedule.ts`에서 가져오면 import 줄에서 이름이 두 번 꼴을 바꾼다. 꼴을 하나로 맞추면 파일을 찾을 때 이름을 변환하지 않는다.

**케이스 충돌이 안 생기는 까닭은 확장자가 꼴을 가르기 때문이다.** ADR-001이 `.tsx`를 더미 UI로 못박아 PascalCase는 `.tsx`에만, camelCase는 `.ts`에만 산다 — `CheckIn.tsx`와 `checkIn.ts`는 소문자화해도 확장자가 달라 한 파일이 되지 않는다. 그 짝을 보는 검사는 보험으로 남긴다.

**성격은 접미사로 단다.** 세그먼트 폴더가 이미 성격을 말하지만 import 줄에는 폴더 이름이 잘려 보일 때가 많고, `model`은 한 폴더에 성격이 넷 산다.

| 접미사 | 사는 자리 | 담는 것 |
| --- | --- | --- |
| `[domain].type.ts` | `model` | 그 도메인의 모양. 런타임에 아무것도 안 한다 |
| `[domain].schema.ts` | `model` | 바깥에서 들어온 값의 꼴 검증. API 응답·딥링크 파라미터·QR 문자열 |
| `<이름>.policy.ts` | `model` | 업무 판정. 순수 함수여야 하고 사이드 이펙트가 없다 |
| `<이름>.reducer.ts` | `model` | 상태 전이. `(state, action) => state`고 순수하다 |
| `[domain].store.ts` | `stores` | zustand store |
| `[domain].context.ts` | `stores` | React Context와 그것을 읽는 훅 |
| `[domain].const.ts` | `consts` | 정해진 값 |
| `[domain].config.ts` | `config` | 환경이 주는 값을 읽는 손 |
| `<이름>.utils.ts` | `utils` | 그 도메인의 순수 도구 |
| `<이름>.lib.ts` | `lib` | 부작용을 내는 손 하나 |
| `[domain].dto.ts` | `api` | 통신이 주고받는 꼴. DB 열 이름을 그대로 든다 |
| `<이름>.mapper.ts` | `utils` | DTO를 도메인 모양으로 바꾸는 순수 함수 |
| `[action].api.ts` | `api` | 통신 하나 |
| `use[Action]Query.ts` | `services` | 읽기 service |
| `use[Action]Mutation.ts` | `services` | 쓰기 service |
| `use<조각>.ts` | `hooks` | controller — `use<화면>Screen.ts`와 `use<조각>.ts`가 같은 꼴이다 |

**store는 `use*`로 불려도 `stores/`에 접미사로 산다.** zustand의 `create`가 돌려주는 것이 훅이라 앞선 판은 「부르는 이름이 이긴다」로 `shared/hooks/useTheme.ts`를 뒀고, 훅으로 안 불리는 것만 `model/clock.store.ts`가 됐다. 자리가 둘로 갈린 것이 그 봉합의 값이었다. `stores/`가 서면 폴더가 성격을 말하니 둘이 같은 접미사를 받는다 — `shared/stores/theme.store.ts`고 쓰는 쪽은 그대로 `useTheme()`이다. 「`use*` export는 `hooks`·`services`·`stores`만」이 그 셋을 함께 허용한다.

**짝 테스트의 갈래는 재는 대상의 갈래다.** `__tests__/useSomething.test.ts`는 그 자체로는 훅을 안 내놓아 내용으로 보면 camel로 읽히는데, 재는 대상이 훅이면 그 이름을 따라간다. **대상이 아직 없는 동안은 `use` 뒤에 대문자가 오는 것을 훅 짝으로 읽고 판정을 유예한다** — TDD라 테스트가 훅보다 먼저 서는데 그 사이에 camel을 요구하면 writer가 camel로 짓고 implementer가 훅을 만들며 이름을 다시 바꾼다. 그 마찰이 task 셋에서 났다.

**열여섯 꼴에 안 맞는 파일은 접미사가 없다.** `shared/api/queryKeys.ts`처럼 통신 행위가 아니라 통신의 약속인 것, `shared/utils/`의 색 표처럼 도메인이 없는 것이 그렇다. 접미사는 성격이 섞이는 자리를 가르는 장치라, 섞일 것이 없으면 안 붙인다.

**`type`과 `schema`가 둘인 까닭은 사는 시간이 달라서다.** 타입은 컴파일 때 사라지고, 바깥에서 들어온 값은 런타임에 꼴을 확인해야 한다. 지금 `validateProfile`과 홀리데이 API 응답 파싱이 그 일을 손으로 하는데 둘이 다른 자리에 있다. 검증 라이브러리를 들이든 손으로 쓰든 자리는 `schema`다.

**`reducer`는 `policy`의 이웃이다.** 둘 다 순수한데 묻는 것이 다르다 — `policy`는 「이것이 허용인가」에 답하고 `reducer`는 「다음 상태가 무엇인가」에 답한다. **가름은 `useReducer`를 타느냐다.** `screens/rehearsal/model/addSheetState.reducer.ts`가 그 꼴이고 `RehearsalScreen.tsx`가 그것을 `useReducer`에 건다 — 전이 함수와 action 유니언이 `.reducer.ts`에 살고 훅 호출은 controller나 `.tsx`에 남는다. `screens/scheduleAdmin/model/adjustChoiceState.policy.ts`는 상태 꼴과 전이를 들어도 `useReducer`를 안 타고 화면 둘이 함수로 부르므로 `.policy.ts`다.

**Context는 `stores`다.** 하위트리에 상태를 나눠 주는 도구고 zustand와 역할이 같다. Context 객체와 그것을 읽는 훅이 `<도메인>.context.ts`에 살고 Provider 컴포넌트는 `.tsx`라 `ui/`에 남는다 — 지금 `shared/ui/DragAndDrop.tsx` 하나가 Context와 Provider와 훅 둘과 컴포넌트 둘을 삼백한 줄에 들고 export 다섯을 낸다.

**`policy`는 순수다.** 통신도 시계도 난수도 못 쓴다 — 「지금 지각인가」를 판정하려면 시각을 받아야 하고 제가 읽어선 안 된다. 그래서 테스트가 입력만 주면 돌고, 같은 판정을 서버 함수가 SQL로 또 쓸 때 두 쪽을 같은 표로 맞출 수 있다.

**`dto`와 `type`이 둘인 까닭은 누가 그 모양을 정하느냐가 달라서다.** DTO는 DB 스키마가 정하고 마이그레이션이 바꾼다. `type`은 우리가 정하고 업무가 바뀔 때 바뀐다. 한 파일에 섞으면 「이 도메인의 모양이 무엇인가」에 답하려고 열었을 때 절반이 DB 열 이름이고, 열 이름을 바꿀 때 무엇이 깨지는지도 그 파일 전체를 읽어야 안다.

**`Row` 접미사가 정반대 둘을 가리키고 있었다.** 저장소의 `*Row` 서른아홉 중 열여섯은 Supabase가 돌려주는 생 꼴이고(`entities/*/api/`) 스물셋은 「이 목록의 한 줄」이라는 뷰 꼴이다(`screens/*/utils`·`model`). `MemberRow`와 `PickerRow`가 같은 이름을 쓰는데 하나는 DB 계약이고 하나는 우리가 조립한 것이다. 앞의 열여섯이 `dto`를 받고 뒤의 스물셋은 그 자리에 남는다 — 그것들은 DB를 안 보는 순수 가공물이다.

**DTO는 `api` 세그먼트를 안 떠난다.** `.api.ts`가 돌려주기 전에 `.mapper.ts`를 불러 도메인 모양으로 바꾼다 — 매퍼는 꼴 바꾸기라 `utils`에 살고(ADR이 `utils`를 「꼴 바꾸기·고르기·세기」로 적는다) 순수해서 짝 테스트가 붙는다. 지금 통신 열이 생 행을 그대로 내보내 DB 열 이름이 뷰까지 닿아 있다 — `MembersScreen.tsx`가 `MemberRow`를 그대로 받는다.

**화면 훅은 그 화면 이름을 받는다.** `screens/<슬라이스>/hooks/use<화면>.ts`고 `Query`·`Mutation` 접미사는 안 붙는다 — 그 둘은 서버 상태를 읽고 쓰는 훅의 표시고, 화면 훅은 그것들을 모아 화면 하나가 쓸 꼴로 내놓는다. `screens/wages/hooks/useWagesScreen.ts`가 그 꼴이다.

**훅 이름에 `Query`와 `Mutation`을 박는다.** 파일 이름과 export 이름이 같아야 코드에서 파일로 바로 건너가니 함수 이름도 같이 바뀐다 — `useMonthSchedule`이 `useMonthScheduleQuery`가 된다. 호출부가 그 이름만 보고 읽기인지 쓰기인지 알고, 층의 뜻(entities는 읽기·features는 쓰기)이 import 줄에서 보인다.

**폴더 이름도 camelCase다.** 슬라이스 폴더가 `workRequest`·`scheduleDay`고 세그먼트 폴더는 단어 하나라 영향이 없다. `screens/`의 슬라이스는 ADR-001이 「라우트 이름과 같게」로 정했는데 그 짝을 camel로 읽는다 — 라우트 `/admin-home`의 슬라이스가 `screens/adminHome`이다. 1:1이 유지되면서 저장소에 폴더 꼴이 하나만 산다.

`src/app/`과 `eslint-rules/`는 밖이다. 전자는 파일 이름이 URL이고, 후자는 `eslint.config.mjs`가 그 이름으로 플러그인을 부르는 생태계 관례다.

**타입은 `[domain].type.ts`에 모은다.** 지금 타입 선언 사백아흔둘이 파일 이백여든넷에 흩어져 있어 「이 도메인의 모양이 무엇인가」에 답하려면 그 파일을 다 열어야 한다. 쓰는 곳에만 있는 좁은 타입(함수 하나의 인자 꼴)은 그 파일에 남지만, **도메인의 모양을 말하는 타입은 밖으로 뺀다** — 그러면 그 파일 하나가 「이 도메인은 무엇인가」의 답이 된다.

**캐시 키는 팩토리 객체 하나다.** 배열 리터럴을 손으로 쓰면 같은 키가 자리마다 조금씩 다르게 적힌다. `queryKeys.schedule.month(month)` 꼴로 함수를 타면 접두사가 한 곳에서 나오고, 쓰기가 낡게 할 범위도 `queryKeys.schedule.all`처럼 이름으로 고른다.

**`.tsx`는 접미사가 없다.** `.tsx`가 곧 컴포넌트라 성격이 하나뿐이고, 이름은 PascalCase 그대로다 — `ui/` 세그먼트가 전부 그것이다. `screens/`의 `model/`과 `utils/`는 안쪽이다: 그 층도 `.ts`에 판정과 타입이 섞여 산다. `src/app/`도 밖이다 — Expo Router가 파일 이름을 URL로 읽어 `checkIn.tsx`가 `/check-in`이고 그 주소는 종이 QR에 실려 나간다.

**Supabase 클라이언트 타입은 `DB`다.** 데이터베이스의 약자라 두 글자가 다 대문자다. 약어가 이름 안에 올 때도 같다 — `words()`가 소문자 뒤의 대문자만 가르니 약어를 붙여 쓰면 camel 변환이 그 조각을 못 나눈다는 것은 알고 쓴다.

**ESLint 규칙 이름은 kebab으로 둔다.** `house/dumb-ui`는 파일 이름이 아니라 그 생태계의 식별자고, 소스의 `eslint-disable` 주석이 그 이름을 그대로 쓴다. 규칙 파일(`eslint-rules/dumbUi.mjs`)은 camel이고 등록 키는 kebab이다.

## `ui`가 사는 네 자리

[ADR-016](ADR-016-fragments-own-their-data.md)이 이 절을 대체한다. 기준이 「통신하지 않는다」에서 「무엇을 아는가」로 바뀌었다.

`ui`가 모든 층에 선다. 어디 사는지는 **무엇을 아는가**가 정한다.

| 자리 | 기준 | 지금 |
| --- | --- | --- |
| `shared/ui` | 도메인을 **모른다.** props가 원시 타입이거나 자기가 선언한 타입 | 51 |
| `entities/<도메인>/ui` | 도메인 타입을 props로 **받고 통신하지 않는다.** 여러 화면이 같은 모양으로 쓴다 | 0 |
| `features/<use case>/ui` | 그 **use case를 실행한다.** 자기 슬라이스의 service를 부른다 | 1 |
| `screens/<슬라이스>/ui` | 한 화면 전용 | 34 |

**`features/*/ui`만 service를 부를 수 있다.** 그것이 use case를 실행하는 조각이라는 뜻이고, 「근무 신청 보내기」 버튼처럼 눌리면 그 use case가 도는 자리다. 나머지 셋은 props만 받는다 — `screens/*/ui`는 controller를 거치고, `entities/*/ui`와 `shared/ui`는 부르는 쪽이 값을 들고 온다.

**`entities/*/ui`가 지금 0인 것은 정상이다.** `screens/*/ui` 서른넷 중 두 슬라이스 이상이 쓰는 조각이 하나도 없고, 도메인 타입을 받는 넷도 각각 한 화면에서만 쓰인다 — 올라갈 이유가 없다. 자리를 적어 두는 까닭은 올 때 묻지 않기 위해서다. `SlotCard`가 `ScheduleSlot`을 그대로 받고 관리자·근무자 양쪽 근무표에서 쓰이면 그때가 그 자리다.

**`shared/ui`가 도메인 낱말을 쓰는 열다섯은 그대로 둔다.** `RosterRow`·`SlotCard`·`ScheduleDayCell`이 이름에 도메인을 달고 있지만 **도메인 층을 하나도 import하지 않는다** — `position: string`을 받고, `stateOf: (date: string) => ScheduleDayCellState`처럼 콜백으로 판정을 받는다. `shared`가 위층을 모른다는 규칙을 지키려고 props를 평평하게 받는 우회고, 그 우회가 깨끗해서 옮길 이유가 없다. 대가는 「근무표 달력」이 근무표 도메인에 안 사는 것이다.

## `.tsx`는 조립만 한다

**`ui/*.tsx`는 최종 오케스트레이션 레이어다.** 조각을 배치하고 controller가 준 값을 꽂는다. 그 위의 어떤 일도 밖에 산다.

| `.tsx`가 하는 일 | `.tsx`가 안 하는 일 | 어디로 |
| --- | --- | --- |
| 조각을 배치한다 | 값을 **만든다** — 포맷·문안·판정 | controller가 완성해 준다 |
| controller가 준 값을 꽂는다 | 갈 데를 **고른다** | controller가 경로를 값으로 준다 |
| 상태 이름으로 조각을 고른다 | 상태마다 **그린다** | 상태마다의 조각 |
| 자기 UI 상태를 든다(아래 절) | 시트를 하나씩 **배선한다** | 고르는 자리 하나 |

**조각도 controller를 가진다.** `ui/MemberSheet.tsx` 옆에 `hooks/useMemberSheet.ts`가 서고, 조각이 받는 것은 식별자뿐이다 — 문구와 판정과 열림 상태를 그 훅이 든다. controller를 화면 단위로만 두면 조각의 로직이 갈 데가 없어 `.tsx`에 남거나 화면 controller가 조각의 props까지 만드는 뭉치가 된다. 전자가 지금 상태고 **`screens/*/ui`가 `model`·`utils`를 값으로 당기는 스물다섯 건**이 그 증거다 — `MemberSheet.tsx` 하나가 `canSaveDisplayName`·`formatBirthDate`·`spellGender`·`spellLeftAt` 넷을 부른다.

**그 값이 controller를 거치면 lint가 경계를 본다.** `ui` → `model`·`utils` import는 지금 아무 규칙도 안 문다 — `api`·`services`·supabase 셋만 막혀 있어서, 판정 함수를 당기는 길이 열려 있다. controller가 유일한 통로가 되면 그 import 자체를 막을 수 있다.

**조각이 controller를 통째로 받는 선은 「그 화면 밖에서 쓰일 수 있나」다.** 폼 조각처럼 실어 넘길 값이 스물을 넘으면 개별 props로 적는 것이 AC-06이 없애려던 배선 베끼기와 같은 종류가 되니, `screen: <화면>Controller` 하나를 받는다 — `PendingSummary`·`PendingEditor`·`ProfileSheets`가 그 꼴이다. 반대로 `MemberRows`처럼 다른 화면이 쓸 수 있는 조각은 개별 props로 받는다. 받는 꼴이 곧 올라갈 수 있는지를 말한다 — `entities/*/ui`는 도메인 타입을 props로 받는 자리라 화면 controller를 받는 조각은 거기 못 간다.

**한 `.tsx`가 화면 둘을 들지 않는다.** `PendingScreen.tsx`가 `stage` 넷으로 각자 `<Screen>`을 그려 사실상 화면 넷이고, `ScheduleAdminScreen.tsx`는 `screen.day !== null`로 날 상세와 달력을 가른다. 조건으로 갈리는 화면은 파일로 갈린다 — 라우트가 고르거나, 상위 `.tsx`가 조각 둘 중 하나를 고른다.

## 화면 파일의 `useState`

**UI를 담당하는 로직이면 `.tsx`에 있어도 된다.**

| 허용 | 안 됨 |
| --- | --- |
| `menuOpen` — 팝오버가 열렸나 | `values` — 서버에서 온 값 |
| `openId` — 어느 시트가 열렸나 | `sending` — 통신 중인가 |
| `face` — 시트의 어느 면인가 | `failed` — 통신이 실패했나 |
| `width`·`trackWidth` — 측정한 너비 | `toast` — 업무 결과 메시지 |
| `focused` — 입력이 포커스됐나 | `draft` — 제출될 값 |

가름의 축은 그 상태가 **화면이 어떻게 보이나**를 드느냐, **업무가 어떻게 됐나**를 드느냐다.

오른쪽 넷은 대개 **들 필요가 없다.** React Query가 `isPending`·`isError`·`data`로 이미 준다 — 화면이 `useState`로 그것을 흉내던 것이다. `MembersPendingScreen.tsx`가 상태 일곱 중 넷을 그렇게 쓴다.

**기계가 보는 축은 import다.** 그 `.tsx`가 `api`·`services`·`hooks`를 당기면서 상태를 들면 controller 일을 겸한 것이고, 아무것도 안 당기고 상태만 들면 presentation 내부다. `shared/ui`에서 상태를 든 여섯이 전부 후자라 이름으로 주는 면제가 안 생긴다.

## 슬라이스를 쪼개는 기준

**`entities`는 도메인 하나다.** 그 도메인을 읽는 dal과 쿼리 훅과 제약이 한 슬라이스에 산다.

**`features`는 use case 하나다.** 기준은 「누가 무엇을 바꾸나」고, 그 쓰기를 하는 dal과 뮤테이션 훅이 한 슬라이스에 산다. entities와 같은 이름으로 쪼개지 않는다 — 그러면 features가 엔티티를 거울처럼 베낀 층이 되고, 층이 둘인 뜻이 사라진다.

**도메인을 합치는 읽기도 `features` 슬라이스 하나다.** 기준은 「무엇을 합치나」고 쓰기가 없어도 된다(위 「읽기와 쓰기」). 합치는 슬라이스는 제 질의를 열지 않고 `entities`의 쿼리 훅을 불러 맞춘다 — 그래서 「`features/`의 `useQuery` 금지」가 그 자리에서도 선다.

**`screens`는 쪼개지 않는다.** ADR-001이 「슬라이스 이름은 라우트 이름과 같게 짓는다」로 정했고 라우트가 하나면 슬라이스도 하나다. 그 안을 `ui`와 `model`로 가르는 것이 할 수 있는 전부다.

## 집행

검사 열일곱을 세운다. 폴더와 이름이 뜻을 가지면 그 뜻을 기계가 지킨다 — 안 그러면 다음 task가 아무 데나 넣고 폴더는 한 달 안에 뜻을 잃는다.

| 규칙 | 막는 것 | 지키는 것 | 보는 것 |
| --- | --- | --- | --- |
| `@supabase/supabase-js`를 `api/` 밖에서 import 금지 | 통신이 `model`이나 `hooks`로 새기 | `api`가 통신의 유일한 문이라는 것 | lint 규칙 |
| `hooks`·`services`·`stores` 밖의 `use*` export 금지 | 훅이 `model`이나 `api`에 섞이기 | 세그먼트의 뜻 | lint 규칙 |
| `services/` 밖에서 `useQuery`·`useMutation` 금지 | service가 controller와 화면에 흩어지기 | service의 집이 하나라는 것 | lint 규칙 |
| `stores/` 밖에서 `create()`·`createContext` 금지 | 전역 상태가 여러 폴더에 살기 | store의 집이 하나라는 것 | lint 규칙 |
| `ui/`에서 `api/` import 금지 | presentation이 저장소에 직통 | 계층 셋의 경계 | lint 규칙 |
| `screens/*/ui`·`shared/ui`·`entities/*/ui`에서 `services/` import 금지 | controller 건너뛰기 | `features/*/ui`만 use case를 실행한다는 것 | lint 규칙 |
| `entities/`의 Mutation 금지 · `features/`의 Query는 entities 둘 이상을 읽을 때만 | 층을 가로지르는 읽기·쓰기 | **층의 뜻** | lint 규칙 |
| `.policy.ts`·`.reducer.ts`에서 통신·시계·난수 금지 | 판정과 전이가 바깥을 읽기 | 둘이 순수하다는 것 | lint 규칙 |
| 접미사가 사는 세그먼트와 맞는지 | `api/`의 `.policy.ts`처럼 어긋난 자리 | 접미사가 성격을 말한다는 것 | `tests/lint/fileNaming.ts` |
| 이름이 camelCase인지 | kebab이 다시 들어오기 | 꼴 하나 | `tests/lint/fileNaming.ts` |
| 폴더 이름이 camelCase인지 | 폴더만 kebab으로 남기 | 꼴 하나 | `tests/lint/fileNaming.ts` |
| 캐시 키 배열 리터럴 금지 | 키를 손으로 쓰기 | 팩토리가 유일한 문이라는 것 | lint 규칙 |
| `consts/` 밖의 `export const <대문자_스네이크>` 금지 | 업무 상수가 판정 파일에 숨기 | 상수의 집이 하나라는 것 | lint 규칙 |
| `process.env`·`Constants`를 `config/` 밖에서 읽기 금지 | 환경값을 코드 아무 데서나 읽기 | 환경이 들어오는 문이 하나라는 것 | lint 규칙 |
| `expo-*`·`react-native` SDK를 `lib/`·`ui/`·`hooks/` 밖에서 import 금지 | 부작용이 `model`·`utils`에 숨기 | `policy`와 `utils`가 순수하다는 것 | lint 규칙 |
| `api`·`services`·`hooks`를 당기는 `.tsx`에서 상태 금지 | presentation이 controller를 겸하기 | 「화면 파일의 `useState`」 절 | lint 규칙 |
| `.dto.ts`를 `api/` 밖에서 import 금지 | DB 열 이름이 화면까지 닿기 | DTO가 통신의 계약이라는 것 | lint 규칙 |
| `api/` 밖에서 snake_case 필드 선언 금지 | DTO 꼴을 import 없이 베끼기 | 같은 축 — 규칙이 import만 보면 못 보는 길 | lint 규칙 |
| `ui/`에서 `model`·`utils`를 **값으로** import 금지 | presentation이 값을 만들기 | 「`.tsx`는 조립만 한다」 절 | lint 규칙 |

**`features/`의 Query를 이름으로 면제하지 않는다.** 앞선 판은 `useAttendanceMonths` 하나를 이름으로 빼줬는데, 이름 면제는 그 파일이 없어진 뒤 아무것도 안 가리키는 구멍이 된 전례가 있다(`dumbUi.mjs`가 사라진 `providers.tsx`를 빼주고 있었다). 조건으로 바꾸면 기계가 import를 세어 판정한다 — `entities` 둘 이상을 읽는 Query는 어느 `entities`에도 못 앉으므로 위층이 받는다.

**경계가 지금 어디서 깨졌나.** presentation이 **값으로** 당기는 것을 셌다.

| 금지 | 지금 | 뜻 |
| --- | --- | --- |
| `ui` → `api` | 0 | presentation이 repository 직통 |
| `ui` → Supabase 클라이언트 | 0 | 같은 축 |
| `ui` → `services` | 0 | controller 없이 service 직접 |
| `ui` → `.dto.ts` | 0 | DB 열 이름이 뷰에 |
| `ui` → `utils` 함수 | 22 | 가공이 화면에 |
| `ui` → `model` 함수 | 5 | 업무 판정이 화면에 |
| `model` → `api` | 0 | 판정이 통신을 안다 |
| `api` → `model` | 0 | repository가 판정을 부른다 |
| `utils` → `api` | 0 | 순수 도구가 통신을 안다 |
| `utils` → `hooks` | 0 | 순수 도구가 React를 안다 |

**넷이 닫혔고 하나가 남았다.** 통신 쪽 축(`api`·`services`·클라이언트·`.dto.ts`)은 검사가 서서 0이다. 남은 `ui` → `utils`·`model` 스물일곱은 **아무 규칙도 안 문다** — 포맷과 판정을 당기는 길이 열려 있고, 그 스물일곱이 「`.tsx`가 값을 만든다」의 전부다.

정상인 방향은 `ui` → `ui` 58(컴포넌트끼리) · `services` → `api` 66 · `api` → 클라이언트 77이다. **`ui` → `hooks`가 셋뿐인 것이 controller가 없다는 증거다** — 그 셋이 96+91+68을 받아야 한다.

**상태 금지가 가장 많이 걸린다.** `.tsx` 마흔넷이 상태·효과를 들고 호출이 이백아흔둘이다. 규칙은 controller가 선 뒤에 켠다. `className` 조립과 `isLoading` 분기는 통과시키고, `api`·`services`·`hooks`를 안 당기는 `.tsx`의 상태도 통과시킨다.

**에러 코드 판정도 `.tsx`를 떠난다.** `error.code === "already_decided"` 꼴이 화면 파일 여섯에 열다섯 건 있다. 「그 코드면 무엇을 보여주나」는 업무 판정이라 `model/<도메인>.policy.ts`가 받고, 서버가 코드를 바꿀 때 고칠 자리가 하나가 된다.

**`export const <대문자_스네이크>` 금지에 예외가 둘이다.** `queryKeys`·`staleTogether`는 통신의 약속이라 `api`에 살고 꼴이 camel이다. 열거 목록을 타입이 바로 읽는 자리(`ERROR_CODES` → `ErrorCode`)는 `consts/`에 두고 `model/`이 그것을 import한다 — 타입이 상수를 읽는 방향은 허용이고 그 반대는 아니다.

셋째 줄이 이 ADR의 핵심을 지킨다. 첫 줄은 [ADR-003](ADR-003-supabase-and-integration-tests.md)의 「클라이언트는 `dals`에서만」을 새 이름으로 옮긴 것이다 — 세그먼트가 `api`로 바뀌었으니 그 규칙도 `api`를 가리킨다.

**첫 줄이 막는 것은 SDK를 당기는 것이고 손잡이를 받는 것이 아니다.** `@supabase/supabase-js`를 import하면 클라이언트를 만들거나 그 타입을 짓는 자리고 그것이 `api`의 일이다. 반면 `shared/api`의 싱글턴을 당겨 아래로 넘기는 것은 화면의 일이다 — 지금 `screens/`와 `src/app/`의 스물넷이 그렇게 받아 훅과 통신에 넘긴다. 둘을 한 규칙으로 묶으면 의존성 주입이 선 방식 자체가 막힌다. 화면이 통신을 **직접 부르는** 축은 `house/dumb-ui`가 이미 막는다.

`fileNaming.ts`는 지금 kebab을 요구하는 자리라 그것을 camel로 바꾸고 접미사 검사를 더한다. 「훅 파일은 `use`로 시작한다」와 케이스 충돌 검사는 그대로 산다.

## 함께 정한 것

**캐시 키는 `shared/api/queryKeys.ts` 한 자리의 팩토리다.** 쓰기 슬라이스가 성공한 뒤 낡게 할 키는 읽기 슬라이스의 것이고, `no-cross-slice-import`가 같은 층 슬라이스끼리 import를 막아 쓰기가 그 키에 닿을 수 없다. 키의 정본이 코드가 아니라 [runtime.md](../system/runtime.md)라고 이미 적혀 있고, 「어느 쓰기가 어느 읽기를 낡게 하나」는 슬라이스 하나가 아니라 앱 전체의 약속이다.

**옮기는 일은 `git mv`로 한다.** TDD 훅은 Write와 Edit만 보고 Bash를 안 본다([ADR-001](ADR-001-fsd-layout-and-tdd-guard.md)이 그 구멍을 알고 남겼다). 테스트를 같이 옮기면 짝이 유지되고, 파일 내용을 한 줄도 안 고치는 커밋이 되어 되돌리기가 revert 한 번이다.

**세그먼트끼리는 자유롭다.** 막히는 것은 슬라이스 경계 하나뿐이라, 세그먼트 고정은 import를 한 줄도 막지 않는다. 슬라이스 쪼개기만 캐시 키를 먼저 치운 뒤에 간다.

**통신 하나가 파일 하나다.** `api/`에 CRUD를 묶지 않는다 — `addSlot.api.ts`와 `removeSlot.api.ts`가 따로 선다. 지금 dal 일흔넷이 이미 그 꼴이라 바뀌는 것은 이름뿐이다. 묶으면 한 파일이 읽기와 쓰기를 같이 들어 층의 가름이 파일 안에서 무너진다.

**`shared/api/errors.ts`를 가른다.** 그 파일이 `DomainError` 타입과 `toApiError()` 변환을 같이 들어, 에러를 다루는 `model` 둘이 통신 세그먼트를 당기고 있다. 타입은 `shared/model/error.type.ts`로, 코드 목록은 `shared/consts/error.const.ts`로, 변환 함수는 `api`에 남는다 — Supabase 에러 객체를 받는 손이다.

**폴더를 미리 만들지 않는다.** ADR-001의 「슬라이스 안에 파일을 바로 두다가 같은 성격이 셋째로 생기면 그때 세그먼트 폴더로 묶는다」는 그대로 유효하다. 고정한 것은 이름이고, 언제 폴더를 만드는지는 안 바꿨다.

## 남는 위험

**`features`가 서버에 직접 닿는다.** 쓰는 dal이 features로 올라가면 그 층이 Supabase를 직접 부른다. entities를 거치지 않는 것이 FSD의 일반 관례와 다른데, 쓰기는 재사용되지 않아 거쳐 갈 자리가 없다. 재사용되는 쓰기가 생기면 그때 entities로 내린다.

**use case의 크기 기준이 없다.** 「누가 무엇을 바꾸나」로 가르면 dal 하나짜리 슬라이스가 생긴다(`qualification-grant`·`adjustment`·`holiday`). 작다고 묶으면 기준이 흐려지고, 안 묶으면 슬라이스가 많아진다. 지금은 안 묶는 쪽으로 갔다 — 쓰기가 늘 때 그 슬라이스가 자라는 것이 자연스럽다.

**이름 고정이 다음 성격을 막을 수 있다.** 열 밖의 성격이 실제로 필요해지면 이 문서를 고친다. 「그 자리에서 만든다」를 막은 것이 이 결정이고, 그래서 늘리는 일도 결정이어야 한다. 아직 안 왔지만 올 것들의 자리는 미리 박았다 — 올 때 묻지 않기 위해서다.

| 올 것 | 자리 | 왜 |
| --- | --- | --- |
| realtime 구독(`.channel`) | `api` | Supabase에 닿는다 |
| 분석·로깅 | `lib` | 부작용이고 통신도 React 훅도 아니다 |
| ErrorBoundary | `ui` | `.tsx`다 |
| feature flag | 환경이 주면 `config`, 업무가 정하면 `consts` | 「개발과 운영에서 값이 다른가」 |
| 재시도·backoff | 숫자는 `consts`, 「다시 걸까」 판정은 `model` | 둘이 다른 성격이다 |
| deep link 파싱 | `model/<도메인>.schema.ts` | 바깥에서 들어온 값의 꼴 검증 |
| 권한 가드 | 판정은 `model`, 라우트에 붙이는 건 `app` | 지금 그 꼴이다 |
| 화면 문안 | `consts/<도메인>.const.ts` | 지금 마흔한 자리에 흩어져 있다 |
| 서버 상태 가공(`select:`) | `utils` | 순수 가공 |

**`entities/*/ui`가 빈 채로 선다.** 자리를 열어 두되 지금 들어갈 파일이 없다 — 상처가 없는데 폴더를 짓는 것이라 증축 규칙에 어긋난다. 적어 두는 값이 「올 때 안 묻는다」 하나뿐이고, 그 값이 실물 없이 선 세그먼트가 뜻을 잃을 위험보다 큰지는 지켜봐야 한다.

**rename 오백서른다섯 건이 이력을 끊는다.** `git mv`가 이름 변경을 기록하지만 내용까지 바뀐 커밋에 섞이면 git이 추적을 놓친다. 그래서 이름만 바꾸는 커밋과 import를 고치는 커밋을 가른다. 같은 기간에 다른 브랜치가 열려 있으면 충돌이 전면전이 되니 이 전환은 열린 브랜치가 없을 때 한 번에 간다.
