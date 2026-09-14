# 문서 지도의 경로를 링크로 만들고 검사가 링크를 읽게 한다

[제안서 docs-structure-followup 7번](../../proposals/docs-structure-followup.md#7-문서-간-이동을-링크로-만들고-검사와-함께-바꾼다)의 실행이다. `CLAUDE.md` 「문서 지도」와 단계 README의 경로가 인라인 코드라 눈으로 찾고 손으로 열어야 한다. 그런데 `tests/lint/doc-map.ts`가 그 코드스팬에서 `docs/` 경로를 뽑아 실존을 검사하니 링크로만 바꾸면 검사 대상이 사라진다 — 문서와 검사를 같은 PR에서 바꾼다.

## 완료 조건

- `CLAUDE.md` 「문서 지도」 불릿의 `docs/` 경로가 전부 링크다. 모양은 `` [`docs/handoff.md`](docs/handoff.md) `` — 글자는 코드스팬 그대로, 감싸는 링크가 목적지를 든다. `.claude/`·`REVIEW.md`처럼 `docs/` 밖 경로도 같은 모양으로 링크한다
- `docs/1-plan/README.md`·`docs/2-design/README.md`·`docs/2-design/architecture/README.md`의 파일·폴더 경로가 실존하는 것이면 상대 링크다. `intent/<슬러그>.md`처럼 자리를 뜻하는 경로는 코드스팬으로 남는다
- `docs/2-design/architecture/README.md`에 도메인 여섯 × 다섯 갈래(domain · data-model · api · runtime · flows) 링크 표가 선다. 표는 링크만 들고 규칙이나 구현 상태를 적지 않는다. 다른 README에 같은 표를 두지 않는다
- `tests/lint/doc-map.ts`가 「문서 지도」 불릿에서 **링크 목적지**(`href`)와 코드스팬 둘 다에서 `docs/` 경로를 뽑는다. 링크 글자와 목적지가 다르면 목적지가 검사 대상이다. `href`에 `#앵커`가 붙으면 앵커 앞까지가 경로다
- `tests/lint/doc-map.test.ts`에 둘이 는다 — 링크 모양의 불릿에서 목적지가 없는 경로를 잡는 것, 글자는 실존하고 목적지만 틀린 불릿을 잡는 것. 기존 코드스팬 케이스는 그대로 통과한다
- `tests/lint/doc-links.ts`의 대상에 `CLAUDE.md`가 든다 — 루트 README와 같은 자리다. `tests/lint/doc-links.test.ts`가 그것을 확인한다
- 검사를 바꾸는 커밋과 문서를 바꾸는 커밋이 갈리지 않는다. 켜는 순간 `pnpm test`가 초록이다

## 범위 밖

- 지도에서 빠진 항목을 잡는 누락 검사. `design-map.ts`가 페이지 목록에서 이미 하고, 전역으로 넓히면 로그와 모든 plan을 지도에 올리라는 강제가 된다
- `docs/log/`의 링크. 회차 기록은 당시 경로를 그대로 둔다
- 페이지 문서·domain·architecture 본문 안의 코드스팬 경로. 지도와 안내 문서만 이번 대상이다

## 검증

`pnpm test`(doc-map·doc-links 짝 테스트 포함)와 `pnpm lint`. `CLAUDE.md`의 링크 하나를 일부러 틀리게 바꿔 `doc-map`이 잡는지 손으로 한 번 본다 — 그 변경은 커밋하지 않는다.
