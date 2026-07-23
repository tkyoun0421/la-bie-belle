# 개발 규칙과 하네스

이 문서는 라비에벨에서 구현을 시작하고 완료하는 개발 규칙의 기준이다. 제품 의미는 [PRD](PRD.md), 도메인 언어는 [Domain](DOMAIN.md), 기술 결정은 [ADR-0008](adr/0008-fsd-server-first-development-guards.md), 실행 상태는 [작업 인덱스](phases/index.jsonl)가 소유한다.

## FSD와 서버 경계

```text
src/
  app/       Next.js route, layout, provider, 얇은 route adapter
  pages/     route 화면 조합
  widgets/   독립적인 화면 블록
  features/  사용자 행위, Server Action, mutation 상태
  entities/  도메인 모델, 순수 규칙, DTO, entity 조회
  shared/    재사용 UI, 설정, 공통 서버 client 기반
```

- 의존은 상위 레이어에서 하위 레이어로만 향한다. `app`만 Next.js route 파일을 가진다.
- 각 slice는 필요한 `ui`, `model`, `api`, `lib`만 만든다. `ui`는 표시와 이벤트 전달만 하며 DB·비밀값·server module을 import하지 않는다.
- 모든 server module은 첫 import로 `import "server-only"`를 선언한다.
- `entities`는 타입, 상태 전이, 순수 규칙, DTO를 소유한다. 여러 entity를 변경하는 command는 `features/*/api`에 둔다.

## 인터페이스와 데이터

- Server Action은 Zod로 외부 입력을 검증하고, 매 호출마다 인증·인가를 확인한다.
- 예상 가능한 실패는 `{ ok: false, code, fieldErrors? }`, 성공은 `{ ok: true, data }` 형태로 반환한다. UI는 `code`를 기준으로 표현한다.
- migration은 schema, 제약, RLS, grant, policy, 함수, trigger, index와 data migration의 유일한 실행 원본이다. 적용된 migration은 수정하지 않는다.
- 생성 DB 타입은 커밋하지만 수동 편집하지 않는다. entity가 DB row를 안전한 DTO로 변환하고 UI는 DTO만 받는다.

## server-first와 TanStack Query

- 서버만 표시할 데이터는 Server Component가 entity server API를 직접 호출한다.
- 상호작용 이후 재조회가 필요한 데이터만 서버 prefetch → dehydrate → `HydrationBoundary` → client query로 전달한다.
- client query는 얇은 read Route Handler를 호출한다. query function에 Server Action을 사용하지 않는다.
- mutation은 Server Action과 `useMutation`을 사용하고 성공한 뒤 명시적인 query key를 invalidate한다.
- cache는 브라우저 저장소에 영속하지 않는다. 기본 `staleTime`은 0이고 mutation 재시도는 비활성화한다.
- experimental streaming, offline mutation replay와 새 라이브러리는 근거·영향을 제시하고 사용자 승인을 받는다.

## RADIO와 검증

task 시작 시 `.agents/runs/<task-id>/radio.md`에 아래 heading을 작성한다.

1. `## Requirements`: spec refs, 범위, 불변 규칙
2. `## Architecture`: FSD slice, 서버 경계, 권한 영향
3. `## Data model`: migration, RLS, 감사 영향 또는 없음
4. `## Interface`: Zod, Result, DTO, cache 영향 또는 없음
5. `## Optimizations`: 측정 근거·선택 또는 기본값 유지

동작·도메인·API·DB·RLS·보안 task는 TDD를 기본으로 한다. 문서·설정·기계적 생성 task만 verification을 사용한다. 권한, 개인정보, 급여, 출퇴근, 계정 복구 변경은 구현·검증을 먼저 끝내고 RADIO와 diff를 사용자에게 보여준 후 확인받아 `done`과 task commit을 만든다.

## Codex와 Git 품질 게이트

- `.codex/hooks.json`의 `SessionStart`는 현재 task와 TDD·검증 계약을 Codex에 전달한다. `PreToolUse`는 Codex가 실행하는 `git commit` 전에 `.agents/harness/scripts/pre-commit.mjs`를 실행하고, 실패하면 commit tool call을 거부한다.
- `test_mode=tdd` task에서 Codex의 파일 편집 전에는 RED → GREEN 증거 규칙을 상기시하고, commit 전에는 `tdd-guard check`를 강제한다. 이는 Git pre-commit hook과 같은 검증기를 사용한다.
- Codex hook은 신뢰된 프로젝트에서만 로드된다. Codex를 다시 시작한 뒤 `/hooks`에서 repository hook을 검토·신뢰해야 한다.
- `.githooks/pre-commit`과 `.githooks/commit-msg`는 Codex 밖에서 만든 commit과 `--no-verify`가 아닌 일반 Git 경로의 최종 방어선이다. 원격 우회 방지는 P0-T05의 CI가 담당한다.

## 실행

`$la-bie-belle-harness`를 사용해 task를 진행한다. 하네스는 index의 실행 계약, TDD 증거, check 결과와 task commit을 검사한다. 포맷과 lint의 실제 package·hook 도입은 P0-T02에서 이 문서의 인터페이스를 따른다.
