---
status: proposed
---

# 문서가 거짓이 된 자리

`docs/`와 `CLAUDE.md`·`REVIEW.md`·`.claude/`의 `.md` 304 파일에서 백틱 토큰 23,355개를 긁고, `src`·`tests`·`scripts`·`eslint-rules`·`supabase`의 1,421 파일을 TypeScript AST로 전수 훑어 맞춘 결과다. 코드는 한 줄도 안 고쳤다.

**정본이 가리키는 대상이 사라진 자리 아홉, 문서가 적은 수가 지금과 다른 자리 아홉, 문서끼리 어긋난 자리 넷, 기계가 셀 수 있는데 검사가 없는 자리 넷이 나왔다.** 묶음으로 치면 집단 개명 넷이 plan·log 쪽 자리 594개를 설명한다.

**검사는 전부 초록이다.** `pnpm test`의 3,471 테스트 가운데 떨어지는 하나는 [관찰 069](../observations/archive/069-query-service-tests-flake-under-full-suite.md)가 든 그 flake고, 문서 검사(`docLinks`·`docMap`·`sourcesExist`·`legacyDocPaths`)와 규칙 카탈로그는 다 통과한다. 아래 자리는 **검사가 안 보는 자리**라 초록인 채로 거짓이다.

## 축 ① — 문서가 가리키는 코드가 없다

### 가리키는 대상이 사라졌다

| 자리 | 문서가 적은 것 | 실제로 있는 것 |
| --- | --- | --- |
| [ADR-002](../2-design/adr/ADR-002-sdd-ddd-tdd.md):15·39·43·49·63·73 | `2-design/domain/` | 그 디렉터리가 없다. [ADR-009](../2-design/adr/ADR-009-design-modules-and-stage-links.md)가 집을 `docs/2-design/modules/<영역>/README.md`로 옮겼다 |
| [notification/design.md](../2-design/modules/notification/design.md):145(둘)·153 | `src/features/notification/model/` — 「lint가 여기서 `node:` import를 막는다」 | `src/entities/notification/model/`. `eslint-rules/noNodeImportInEdgeShared.mjs:9`가 무는 경로도 그쪽이고 `features` 쪽은 `holiday` 둘뿐이다 |
| [evidence/expo-scaffold.md](../4-test/evidence/expo-scaffold.md):36 | `src/shared/lib/fontLoading.ts` | `src/shared/utils/fontLoading.utils.ts` |
| [ADR-015](../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md):49 | `entities/*/dals/`, `features/*/model/use*.ts` | `dals` 세그먼트는 0곳. 훅은 `hooks`·`services`에 산다 |
| [ADR-015](../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md):52 | `profile/dals/avatarsBucket.ts` | `src/features/profileEdit/api/avatarsBucket.api.ts` |
| [ADR-015](../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md):35 | `useMonthSchedule`·`useAddSlot` | `useMonthScheduleQuery`·`useAddSlotMutation`. 같은 문서 211줄이 그 개명을 적는다 |
| [ADR-016](../2-design/adr/ADR-016-fragments-own-their-data.md) 「집행」 표 | 「조각 `.tsx`가 `useRouter` 금지 — 규칙 — 이 ADR이 세울 자리」 | 규칙 40 `house/ui-no-router`가 이미 섰다(`tests/lint/rules.ts:320`) |
| [.claude/agents/sian-auditor.md](../../.claude/agents/sian-auditor.md):27 | `tests/lint/sian-html.ts` | `tests/lint/sianHtml.ts` |
| [plans/list-state-follows-fragments.md](../3-build/plans/list-state-follows-fragments.md):114 | `eslint-rules/__tests__/fragmentStateContract.test.mjs` | 같은 이름의 `.test.ts` |

### 줄 번호만 밀린 자리

**없다.** 문서가 쓴 `파일:줄` 꼴 가운데 대상 파일의 줄 수를 넘는 것이 하나도 없다. 고치는 비용이 다른 갈래라 따로 쟀는데 이번에는 빈 칸이다.

### 집단 개명이 설명하는 묶음

[ADR-015](../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)의 kebab→camel과 세그먼트 재배치가 지나간 뒤 완료된 plan과 log가 그 전의 경로를 그대로 들고 있다. 자리마다 판정할 일이 아니라 꼴 하나를 치환할 일이다.

| 묶음 | 꼴 수 | 지금 |
| --- | --- | --- |
| `tests/lint/<kebab>.ts` | 15 | `docLinks.ts`·`errorCodes.ts`·`fileNaming.ts` 등 camelCase 이름 |
| `scripts/<kebab>.mts` | 5 | `e2eSeedServer.mts`·`generateGlobalsCss.mts` 등 camelCase 이름 |
| `tests/integration/<이름>.test.ts` | 11 | 그 폴더에는 헬퍼 둘(`postgres.ts`·`supabase.ts`)만 남고 integration 96개는 `src/**/api/__tests__/*.integration.test.ts`에 산다 |
| `src/screens/<kebab>/`·`src/features/<도메인>/model/` | plan 바구니 492건의 대부분 | camelCase 슬라이스와 `hooks`·`services`·`api` |

`plans/fsd-read-write-layers.md:530~543`은 조금 다르다. 그 계획이 지은 규칙 파일 이름 일곱(`configSegment.mjs`·`hooksSegment.mjs`·`readWriteLayers.mjs`·`servicesSegment.mjs`·`storesSegment.mjs`·`supabaseClientInApi.mjs`·`uiBoundary.mjs`)과 실제로 선 이름이 다르다. 계획 당시의 이름이라 기록으로 읽히는데, `CLAUDE.md`가 그 문서를 「검사 열일곱을 세운다」의 근거로 가리킨다.

### 거짓 양성으로 가른 것

읽어 보니 어긋남이 아니었다.

- [ADR-001](../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md):13·21의 `app/` — 「`src/` 아래 다섯」을 세는 줄이라 `src/app/`이 맞다
- [ADR-004](../2-design/adr/ADR-004-domain-rules-home.md)가 세 꼴로 가리키는 옛 도메인 자리(`docs/` 바로 아래의 파일과 디렉터리, 그리고 `2-design/domain/`) — 머리글이 「아래 경로는 당시 결정의 기록이다」를 박았다
- [ADR-003](../2-design/adr/ADR-003-supabase-and-integration-tests.md):55의 `SKIP_PREFIXES` — `.claude/hooks/tdd-guard-unit.py:27`에 산다. 파이썬이라 TS 색인 밖이었다
- [plans/screens-calc-placement.md](../3-build/plans/screens-calc-placement.md):152의 `eslint-rules/noCopiedDomainShape.mjs` — 취소선과 「**뺐다.**」가 붙어 있다
- [backlog.md](../backlog.md):89의 `src/app/providers.tsx` — 그 줄 자신이 「그 파일이 없어진 뒤로」를 적는다
- `assets/illustrations/`·`docs/2-design/design-system/canvas/` — 아직 안 만든 자리를 가리키는 문장
- `supabase/functions/_shared/`·`tests/lint/.tmp-format-check/` — `pnpm edge:sync`와 테스트가 런타임에 만들고 `.gitignore` 안이다
- `.claude/agents/`의 `cart` 예시 — 지어낸 이름
- [proposals/docs-structure-followup.md](docs-structure-followup.md)의 `2-design/architecture/*` — 제안이 그 뒤 ADR-009로 뒤집힌 구조
- 바깥 API 이름 22 — `useActionState`·`useOptimistic`·`useFormStatus`·`shouldDehydrateQuery`·`prefetchQuery`·`MapType`·`SKYVIEW` 등 React·TanStack Query·지도 SDK의 이름이다

## 축 ② — 문서가 적은 수가 지금과 다르다

맞은 수는 뺐다. 아래가 어긋난 자리고 괄호 없이 지금 수를 같이 적는다.

| 자리 | 문서 | 지금 | 센 법 |
| --- | --- | --- | --- |
| [ADR-015](../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md):205 | 「저장소의 열셋이 전부 그 꼴」 | 이름 있는 가드 **11**, 전부 `is*`. 이름 없는 인라인 가드가 따로 아홉(`__tests__` 밖 넷)이고 규칙 47은 그것을 안 본다 | AST — 반환 타입이 `TypePredicate`인 함수를 긁고 `is[A-Z]`로 가름 |
| [ADR-015](../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md):110 | 「여덟이 전부고」 | **열**. 같은 문서 105줄은 「열이 전부다」라 한 문서 안에서 갈린다 | `src/` 슬라이스마다 세그먼트 폴더 이름을 세어 가짓수 |
| [ADR-001](../2-design/adr/ADR-001-fsd-layout-and-tdd-guard.md):25 | 「세그먼트는 여덟(`ui`·`hooks`·`api`·`model`·`consts`·`config`·`lib`·`utils`)으로 고정됐고」 | **열** — `services` 32곳과 `stores` 둘이 빠졌다 | 같은 셈 |
| [plans/fsd-read-write-layers.md](../3-build/plans/fsd-read-write-layers.md):14 | 「세그먼트 여덟의 판정 기준」 | 열 | 같은 셈 |
| [ADR-016](../2-design/adr/ADR-016-fragments-own-their-data.md) 「상태는 판별 union이고 이름이 넷이다」 | 「지금 `*ListState`와 `*Body` 여덟이 그 규격 밖에 산다」 | 선언은 여덟인데 규격 밖은 **셋** — `MemberSheetBody`·`NotificationsListState`·`ScheduleWorkerBody`. 나머지 다섯은 판별 union으로 갔다 | AST — 이름이 `ListState`·`Body`로 끝나는 별칭을 긁고 그 안에 `state: "…"` 가지가 있나 |
| 같은 절 | 「`StatsListState`는 탭 셋이 상태 이름 자리에 서서 여섯 갈래고 `NotificationsListState`는 일곱이다」 | `StatsListState`는 판별 union으로 갔다 | 같은 셈 |
| [ADR-016](../2-design/adr/ADR-016-fragments-own-their-data.md) 「왜 지금」 | 「`useScheduleAdminScreen`이 698줄에 service 스물여섯(query 9 · mutation 17)을 든다」 | **568줄 · service 23(query 9 · mutation 14)** | AST — `use*Query`·`use*Mutation` 호출의 서로 다른 이름을 셈 |
| [ADR-015](../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md) 「`Row` 접미사가 정반대 둘을」 | 「저장소의 `*Row` 서른아홉 중 열여섯은 … 스물셋은 …」 | `*Row` 별칭 **88** — `api/` 안 47 · 밖 41 | AST — `Row`로 끝나는 type alias·interface |
| [ADR-015](../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md):24·110 | 「`dals` 일흔넷과 `features/stats/api/` 하나가 같은 일을 한다」 | `dals` 0 · `api` 34 슬라이스 | 세그먼트 폴더 셈 |

맞아서 보고에서 뺀 것은 이렇다. [execution.md](../4-test/execution.md) 「집행되는 규칙」의 표 46줄과 산문 「줄은 마흔여섯」과 마지막 번호 47이 `tests/lint/rules.ts`와 한 줄씩 같고, `CLAUDE.md`의 「열여섯 꼴」이 ADR-015 접미사 표 16행과 같고, `CLAUDE.md`의 세그먼트 「열」이 실물과 같다. 규칙 수 쪽은 `tests/lint/ruleCatalogue.test.ts`가 표를 읽어 대조하니 어긋날 길이 막혀 있다.

## 축 ③ — 문서가 서로 어긋난다

정본 관계는 대체로 문서가 스스로 밝혀 뒀다. `대체한다`·`정본이다`·`근거는`·`후속 결정` 꼴을 384줄에서 긁어 그려 보니 대체 선언 열둘이 서로 맞물려 있고, 「대체됐다고 적힌 쪽이 아직 살아 있나」에서 넷이 걸렸다.

### 세그먼트가 여덟인가 열인가

ADR-015가 자기 안에서 갈린다 — 105줄은 「열이 전부다. `services`와 `stores`가 여덞에 더해졌다」, 110줄은 「이 목록도 닫혀 있다. **여덟이 전부고**」다. 그 둘을 읽는 쪽도 갈렸다. ADR-016:3과 `CLAUDE.md`는 「열」, ADR-001:25의 대체 안내문과 plans/fsd-read-write-layers.md:14는 「여덟」이다. 실물은 열이다.

105줄의 「여덞」은 오타다.

### `dals`가 정본 넷에 살아 있다

ADR-015:346이 「세그먼트가 `api`로 바뀌었으니 그 규칙도 `api`를 가리킨다」고 적었는데, 그 조항을 받아 쓰는 정본들이 아직 `dals`를 현재형으로 든다.

| 자리 | 문장 |
| --- | --- |
| [system/architecture.md](../2-design/system/architecture.md):23 | 「기본 계약: **데이터에 닿는 코드는 `dals`뿐이다.** 화면과 use-case는 `dals` 함수를 부른다」 |
| [system/architecture.md](../2-design/system/architecture.md):25 | 「이유: 조항의 정본은 ADR-003의 「DB 접근을 한곳에 모은다」다」 — 그 정본이 `dals`를 든 쪽이다 |
| [system/data-access.md](../2-design/system/data-access.md):63·65·68·80·134·135·140 | 적용 범위·기본 계약·이유·예외가 전부 `dals`로 쓰여 있다 |
| [4-test/strategy.md](../4-test/strategy.md):24 | 「`dals`의 DB 계약도 여기서 검증한다」 |
| [ADR-003](../2-design/adr/ADR-003-supabase-and-integration-tests.md):7·29·59 | 「DB에 닿는 코드는 `dals` 세그먼트 한곳에 모으고」 — 대체 안내문이 없다 |

`src/`에 `dals` 폴더는 없고 `api`가 34 슬라이스에 산다. ADR-001:27과 ADR-015:20·24·110·346은 `dals`를 「앞선 판이 그랬다」로 쓰니 밖이다.

### `2-design/domain/`이 ADR-002에만 안내문 없이 남았다

같은 이동을 겪은 ADR-004는 머리글에 「ADR-009가 영역 파일의 집을 옮겼다 … 아래 경로는 당시 결정의 기록이다」를 달았다. ADR-002에는 그 줄이 없어 「새 개념이 나오면 `2-design/domain/`에 한 뜻으로 박는다」가 지금 지시로 읽힌다.

검사가 이 자리를 안 잡는 까닭이 따로 있다. `tests/lint/legacyDocPaths.ts`가 옛 경로 꼴 아홉을 저장소 전체에서 막는데, `ALLOWED_LINES`의 ADR-002 항목이 그 경로 자체를 마커로 든다. 마커가 그 꼴이면 그것을 담은 **모든** 줄이 통째로 통과한다 — ADR-004 항목이 「디렉터리로 연다」라는 문장 조각을 마커로 들어 한 줄만 여는 것과 다르다. 기록인 줄과 지시로 읽히는 줄을 가르지 않는다.

### ADR-016의 집행 표가 선 규칙을 「세울 자리」로 둔다

「조각 `.tsx`가 `useRouter` 금지 | 규칙 — 이 ADR이 세울 자리」인데 규칙 40 `house/ui-no-router`가 이미 카탈로그에 있다.

## 축 ④ — 규칙이 집행되지 않는다

집행 재고를 먼저 세웠다. ESLint house 규칙 34개(카탈로그 번호 1~47, 줄 46), `tests/lint/*.test.ts` 41개, `eslint-rules/__tests__/*.test.ts` 30개, 편집 훅 셋(`tdd-guard-unit.py`·`tdd-guard-e2e.py`·`spec-gate.py`에 공용 모듈 `guard.py`), pre-commit 하나, 워크플로 넷(`ci`·`impact`·`pr-review`·`security-scan`)이다.

그 목록을 `CLAUDE.md`와 ADR의 명령문에 맞춘 구멍 넷이 남았다. 사람이 판정할 수밖에 없는 것(「주석은 부채다」의 경계, 문체, ADR-002가 스스로 「훅으로 막지 않는다」고 적은 자리)은 뺐다.

### 산문 속 백틱 경로를 아무도 안 본다

이 감사가 찾은 축 ① 전부가 이 구멍에서 나왔다. 지금 검사 셋은 각자 좁은 자리만 본다.

| 검사 | 보는 것 | 안 보는 것 |
| --- | --- | --- |
| `tests/lint/sourcesExist.ts` | spec·plan frontmatter의 `sources:` | 본문 |
| `tests/lint/docLinks.ts` | 마크다운 링크 `[…](…)`와 앵커 | 백틱 |
| `tests/lint/docMap.ts` | `docs/README.md` 「문서 지도」 절의 code span | 그 절 밖, `docs/` 아닌 경로 |

기계가 할 수 있는 일이다. 백틱 안인지만 가리면 되고, 자리표시자(`<영역>`·`*`·`YYYY`)와 상대 경로와 `파일:줄` 꼴만 처리하면 된다. 이 감사가 쓴 스크립트가 그 꼴이다.

### 전화번호 꼴에 검사가 없다

`CLAUDE.md`가 「전화번호는 `010-0000-000x` 꼴, 실제 값은 DB에만 산다」고 적는데 보는 것이 없다. 밖인 자리가 둘이다.

| 자리 | 값 |
| --- | --- |
| [modules/account/README.md](../2-design/modules/account/README.md):59 | `010-1234-5678` |
| `src/features/profileEdit/api/__tests__/updateMyContact.api.integration.test.ts`:45 | `010-9999-9999` |

ACC-004의 경계 표가 쓰는 `01000000001`·`0100000000`·`01100000001`과 `phoneFormat.api.integration.test.ts`의 `011-0000-000x`는 꼴 규칙 자체를 재는 값이라 안인지 밖인지 판정이 필요하다.

### `.claude/`와 루트 `.md`의 경로가 `legacyDocPaths` 말고는 밖이다

`sian-auditor.md`가 `tests/lint/sian-html.ts`를 가리키는 자리가 그 결과다. 개명이 지나갈 때 agent 정의문은 따라가지 않았고, 그 정의문을 읽는 것이 사람이 아니라 subagent라서 더 조용하다. 위의 첫 구멍을 메울 때 같은 검사가 이 범위를 같이 들면 된다 — `legacyDocPaths.ts`의 `SCANNED_ROOTS`가 이미 `.claude`를 든다.

### 규칙 19의 무는 층이 ADR-016을 안 따라갔다

`eslint-rules/noVisualUtilityClass.mjs:3`의 `TARGET_LAYERS`가 `/src/screens/`·`/src/features/` 둘이다. [execution.md](../4-test/execution.md):240은 그 면제를 「`src/shared/ui/**`는 조각이 사는 자리라, `src/app/_catalog*`는 그 조각을 늘어놓는 자리라 밖이다」로 적는다.

ADR-016이 `entities/<도메인>/ui`를 조각의 집으로 열었고 지금 거기 `.tsx` 23장이 산다. 규칙은 그 층을 안 물고 문서는 그 층을 안 든다. 규칙을 넓힐 일인지 문서의 까닭을 고칠 일인지가 판정이다.

## 판정할 항목

여기서 결정하지 않는다.

1. **ADR-015의 실측 절이 기록인가 현재인가.** 「센 것」 표(49·52)와 「`Row` 접미사가 정반대 둘을 가리키고 있었다」 절, ADR-016의 「왜 지금」 절은 결정을 낳은 실측이다. ADR-004처럼 머리글에 기록임을 박는 길과 수를 지금으로 갈아 쓰는 길이 갈린다. 전자면 문장은 그대로 두고 안내문 한 줄이 붙고, 후자면 다음 리팩터가 또 거짓으로 만든다.
2. **ADR-003의 `dals`.** `api`로 갈아 쓸 것인가, ADR-004 꼴의 대체 안내문을 달 것인가. 어느 쪽이든 `system/architecture.md`·`system/data-access.md`·`4-test/strategy.md`가 같이 간다. 세 문서는 현재형 계약이라 안내문으로는 안 닫힌다.
3. **ADR-002의 `2-design/domain/`.** 안내문을 달 것인가 경로를 `modules/<영역>/README.md`로 갈 것인가. 같이 정할 것이 하나 더 있다 — `legacyDocPaths.ts`의 ALLOWED_LINES가 통째 면제라 어느 쪽으로 정해도 검사가 그 결정을 안 읽는다.
4. **세그먼트가 여덟인가 열인가.** 실물은 열이다. ADR-015 안에서 갈린 두 문장 가운데 어느 쪽을 고치느냐, ADR-001:25의 안내문과 plan:14를 같이 고치느냐가 결정이다.
5. **전화번호 꼴이 어디까지 무느냐.** ACC-004의 경계 표와 `phoneFormat` 테스트가 쓰는 값은 꼴 규칙을 재는 입력이다. 「`010-0000-000x` 꼴」이 그것까지 무는 규칙이면 검사가 면제 목록을 들어야 한다.
6. **규칙 19와 `entities/*/ui`.** 규칙을 넓히면 조각 23장이 걸릴 수 있고, 문서를 고치면 그 층이 왜 밖인지를 적어야 한다.
7. **plan·log의 옛 경로를 고치느냐.** 594자리다. 완료된 plan을 지금 경로로 갈면 그 문서가 당시 무엇을 했는지가 흐려지고, 그대로 두면 다음 감사가 또 긁는다. `legacyDocPaths.ts`처럼 「기록은 밖」을 검사에 박는 길이 셋째다.

## 확인 필요

억지로 판정하지 않았다.

1. [execution.md](../4-test/execution.md):9의 「아래 열하나가 로컬과 CI가 돌리는 명령이다」 — `###` 절은 열하나인데 마지막(「파일을 골라 실행」)이 명령 이름이 아니다. 「명령 열 + 실행법 하나」인지 셋을 그대로 열하나로 세는지 가리지 못했다.
2. `docs/3-build/plans/`의 492건 — 완료된 plan이 당시 경로를 적은 것인지 지금을 적은 것인지가 줄마다 다르다. 묶음으로만 묶고 줄 단위 판정은 안 했다.
3. `docs/log/`·`docs/observations/`의 102건 — 회차 기록이라 대상에서 뺐다. 그 판단의 근거는 `docLinks.ts`가 이미 `docs/log/`를 제외하는 것뿐이고, observations를 같이 빼도 되는지는 [ADR-006](../2-design/adr/ADR-006-observation-log.md)이 답할 자리다.
4. `docs/proposals/`의 9건 — 제안이 채택 뒤 뒤집힌 구조를 가리킨다. 제안 문서가 「이 구조는 다른 결정으로 갔다」를 적는 꼴이 정해져 있는지 확인 못 했다.
5. `.claude/skills/`의 2건 — `scripts/helper.py`·`scripts/run_loop.py`다. 저장소에 임시로 둔 스킬이라([메모리](../../.claude/skills/authoring-skills/SKILL.md)) 바깥 예시로 읽히는데, 그 스킬이 저장소 경로를 가리키는 것이 맞는 꼴인지 모른다.
6. `docs/2-design/modules/notification/design.md`가 `src/features/notification/model/`을 셋 가리키는데, 그 영역의 구현이 `entities/notification`과 `features/notificationRead`로 갈려 있다. 문서가 가리켜야 하는 자리가 둘 중 어디인지는 그 영역 설계가 답할 몫이다.

## 세는 법

다음 감사가 다시 세야 한다. 스크립트는 커밋하지 않았고 아래가 그 꼴이다.

**문서 쪽은 정규식이고 백틱 안인지를 가린다.** 코드펜스(` ``` `·`~~~`) 안을 건너뛰고 한 줄 안의 `` `…` ``만 긁는다. 대상은 `docs/**/*.md`에 루트 `CLAUDE.md`·`README.md`·`REVIEW.md`와 `.claude/**/*.md`를 더한 304 파일이고 토큰 23,355개가 나온다.

경로 꼴은 셋을 뺀다 — 자리표시자가 든 것(`<`·`>`·`*`·`?`·`{`·`}`·`|`·`YYYY`·`MM-DD`), 바깥 scheme(`https:`·`mailto:`), npm scope(`@…`)다. 남은 것 1,790개를 저장소 루트와 그 문서 폴더 양쪽에 붙여 실존을 보고, `파일:줄` 꼴은 대상 파일의 줄 수와 견준다. 바구니를 일곱(`adr`·`canon`·`plan`·`proposal`·`agent`·`record`·`skill`)으로 갈라야 읽을 수 있다 — 안 가르면 752건이 한 덩이로 나와 정본과 기록이 섞인다.

**코드 쪽은 TypeScript AST다.** `grep`은 두 번 틀린다 — 여러 줄 `import` 블록 안의 이름을 놓치고 한 줄에 둘 있는 것을 하나로 센다([관찰](../observations/README.md)에 그 자리가 있다). `node --experimental-strip-types`로 `.mts` 스크립트를 돌려 `src`·`tests`·`scripts`·`eslint-rules`·`supabase`의 1,421 파일을 `ts.createSourceFile`로 파싱한다. 선언 이름 5,187개와 멤버 이름 1,901개와 **등장하는 모든 식별자**를 따로 모은다. 마지막 집합이 중요하다 — 선언만 보면 import된 바깥 이름이 전부 「없는 이름」으로 나온다.

이름 쪽 거짓 양성은 자동으로 못 가린다. 우리 규약 꼴(`use[A-Z]…`, `…Query`·`…Mutation`·`…Keys`·`…Policy`·`…Guard`, `is…`·`has…`·`to…`·`from…`, `…Dto`·`…Row`·`…Type`·`…State`·`…Props`·`…Error`·`…Code`, 대문자 상수)로 1,050개까지 좁혀도 React·TanStack Query의 훅이 그 꼴에 그대로 걸린다. 228건 가운데 22건을 손으로 뺐다.

세는 자리마다의 AST 조건은 이렇다.

| 센 것 | 조건 |
| --- | --- |
| 타입 가드 | 함수의 반환 타입이 `ts.isTypePredicateNode`. 이름은 함수 선언의 제 이름, 변수 선언의 이름, 객체 속성·클래스 멤버의 키 넷에서 읽는다 — 규칙 47이 읽는 자리와 같게 맞춘야 수가 맞는다 |
| 세그먼트 | `src/<층>/<슬라이스>/` 아래 디렉터리 이름(`__tests__` 제외). `shared`는 슬라이스가 없어 한 단계 위다 |
| `as` 단언 | `ts.isAsExpression`이고 타입이 `const` 참조가 아닌 것. `as const`는 `ConstKeyword`가 아니라 이름이 `const`인 `TypeReferenceNode`로 파싱된다 — 그것을 안 빼면 109가 나오고 빼면 셋이다 |
| `*Row`·`*ListState`·`*Body` | 이름이 그 꼴로 끝나는 `TypeAliasDeclaration`·`InterfaceDeclaration`. 규격 안인지는 그 별칭 본문에 `state: "…"` 가지가 있나로 가름 |
| controller 무게 | `use*Query`·`use*Mutation` 꼴 `CallExpression`의 **서로 다른** 이름 수. 같은 훅을 두 번 부르는 자리가 있어 호출 수로 세면 늘어난다 |

**정본 관계는 다섯 꼴을 긁는다** — `대체(한다|했다|된다|됐다)`·`정본(은|이다|이|을)`·`근거는`·`그대로 (산다|고)`·`후속 결정`이다. 384줄이 나오고 「대체했다」가 든 열둘이 그래프의 간선이다. 거기서 「대체됐다고 적힌 쪽이 아직 살아 있나」를 묻는다.

**수 쪽은 두 단계다.** 먼저 한글 수사(`하나`~`백`)와 `\d+(개|건|장|곳|자리|줄|행|쪽)` 꼴을 긁어 4,635줄을 뽑고, 「저장소」·「전부」·「지금」·「셌」·「센 것」이 같이 든 줄로 273개까지 좁힌다. 그다음 자리마다 AST로 다시 센다. 짐작한 수는 하나도 없다.
