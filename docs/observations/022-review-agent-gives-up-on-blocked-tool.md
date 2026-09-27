---
status: actioned
target: .github/workflows/pr-review.yml
date: 2026-09-27
resolved: 2026-09-27
---

# 리뷰 에이전트가 막힌 도구를 만나면 코멘트 없이 끝난다

## 일

관찰 019가 「리뷰 잡이 코멘트 없이 초록으로 끝난다」를 잡아 가드를 세웠다(#430). 가드는 제 일을 했는데, 막아 세우기만 하고 왜 그렇게 끝나는지는 몰랐다 — 019는 「짧은 실행이 되풀이되면 모델·프롬프트를 볼 자리다」로 닫혔다.

되풀이됐고 이제 근거가 있다. `claude-code-action`의 `result` 블록에 `permission_denials_count`가 실린다.

| PR | 턴 | 시간 | 막힌 도구 호출 | 코멘트 |
| --- | --- | --- | --- | --- |
| [#432](https://github.com/tkyoun0421/la-bie-belle/pull/432) | 4 | 38초 | — | 없음 |
| [#438](https://github.com/tkyoun0421/la-bie-belle/pull/438) 첫 실행 | 6 | 42초 | 1 | 없음 |
| #438 재실행 | 8 | 87초 | 8 | 없음 |

`allowedTools`가 `Read`·`Grep`·`Glob`·`gh pr comment`·`gh pr diff`·`gh pr view`·인라인 코멘트 MCP 일곱이다. 파일 예순 장짜리 PR을 감사하려면 diff를 잘라 보게 되는데 그 손이 전부 막히고, 에이전트는 막힌 자리에서 다시 길을 찾는 대신 조용히 끝낸다. 리포트를 못 쓴 것이 아니라 **안 쓰고 나간다** — 프롬프트 어디에도 「무슨 일이 있어도 코멘트 하나는 남긴다」가 없다.

## 고침

`pr-review.yml`을 두 자리 고쳤다.

- `allowedTools`에 읽기 전용 셸 손을 더한다 — `git diff`·`git log`·`git show`·`wc`·`head`·`tail`·`sed`·`sort`·`uniq`·`ls`. 전부 읽기라 PUBLIC 저장소 가드(fork·draft 제외, `contents: read`)를 넓히지 않는다.
- 프롬프트에 한 줄을 더한다 — 「도구가 막히거나 다 못 본 자리가 있으면 그 사실을 「못 본 곳」에 적고, 어떤 경우에도 `gh pr comment`로 코멘트 하나는 남긴다.」

가드는 그대로 둔다. 이 고침이 듣는지를 재는 것이 그 가드다.

## 원칙

도구 목록을 좁히는 것은 안전이 아니라 거래다 — 좁힌 만큼 에이전트가 길을 잃고, 길을 잃은 자리에서 무엇을 할지는 프롬프트가 정해야 한다. 「실패해도 산출물 하나는 남긴다」를 안 적으면 조용히 빈손으로 끝난다.
