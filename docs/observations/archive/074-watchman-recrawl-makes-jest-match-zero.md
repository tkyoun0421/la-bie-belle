---
status: actioned
resolved: 2026-10-16
target: docs/4-test/execution.md
date: 2026-10-15
---

**일**: watchman이 파일을 다시 수집하는 동안 jest가 오류 없이 0건을 냈다. `--no-watchman`을 붙이면 같은 실행이 정상으로 돈다. 패턴이 안 맞아 0건이 되는 함정이 이미 있는데, 이쪽은 패턴이 맞는데도 0건이라 겉으로 구분이 안 된다.

**고침**: `execution.md`의 jest 주의에 「0건이면 `--listTests`로 목록을 보고, 목록이 비면 `--no-watchman`으로 다시 돌린다」를 한 줄 더한다.

**원칙**: 검사가 아무것도 안 돌고 초록이면 통과가 아니라 비어 있는 것이다. 0건은 성공 수로 세지 않는다.
