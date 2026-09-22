---
status: open
target: .github/workflows/ci.yml · scripts/check-sources-impact.mts
date: 2026-09-22
resolved:
---

# 재실행이 옛 PR 본문을 읽어 고친 본문이 안 보인다

## 일

`sources` 영향 검사가 PR 본문의 「영향 확인」 절이 바뀐 문서 다섯을 안 든다고 빨개졌다. 본문을 고치고 `gh run rerun --failed`를 돌렸는데 같은 다섯 줄로 또 빨개졌다.

검사가 아니라 워크플로다. `.github/workflows/ci.yml:50`이 `PR_BODY: ${{ github.event.pull_request.body }}`로 본문을 받는데 재실행은 처음 이벤트의 payload를 그대로 다시 쓴다. 고친 본문이 읽히려면 새 커밋을 밀어 `synchronize` 이벤트를 일으켜야 한다.

검사가 요구하는 고침은 본문 수정 하나인데, 그 수정만으로는 검사가 다시 안 돈다.

## 고침

`PR_BODY`를 이벤트 payload 대신 `gh pr view --json body`로 받으면 재실행이 그 자리에서 통한다. 아니면 검사의 실패 메시지가 「본문을 고쳤으면 새 커밋을 밀어야 다시 읽는다」를 같이 낸다.

## 원칙

검사가 요구하는 고침과 검사를 다시 돌리는 방법이 어긋나면 사람이 같은 빨강을 두 번 본다. 검사를 세울 때 그 검사를 통과시키는 손이 몇 번인지도 같이 본다.
