---
status: open
target: tests/lint/
date: 2026-10-02
resolved:
---

# 주석이 가리키는 파일 경로는 아무 검사도 안 본다

묶음 7이 파일 268개를 옮긴 뒤 테스트 머리글 마흔셋이 옮기기 전 자리를 그대로 들고 있었다.

```
src/entities/qr/hooks/__tests__/useQrCodeQuery.test.ts:4
// 구현 대상: src/entities/attendance/hooks/useQrCodeQuery.ts
```

그 파일은 `src/entities/qr/hooks/useQrCodeQuery.ts`에 산다. 치환 스크립트가 `"@/..."` 꼴만 바꿔서 주석의 `src/...`는 안 바뀌었다.

## 왜 아무것도 안 울었나

| 검사 | 왜 못 보나 |
| --- | --- |
| `pnpm typecheck`·`pnpm lint` | import가 아니라 주석 안의 글자다 |
| `docLinks.test.ts` | 마크다운 링크를 보고, `docs/` 밖은 범위가 아니다 |
| `tests/lint/legacyDocPaths.ts` | 문서가 `src/app/` 밖의 옛 구조를 가리키는지만 본다 |

그래서 **옮긴 파일을 따라가는 유일한 줄이 가장 늦게 썩는다.** 이 주석은 테스트가 무엇을 덮는지 알려주는 자리고, 틀리면 다음 사람이 없는 파일을 뒤진다.

## 같은 꼴 둘

실재하지 않는 `src/` 경로를 저장소 전체에서 뽑아 보니 셋으로 갈린다.

- **옮기기가 남긴 것** — 테스트 머리글 마흔셋, `readAppUrl.ts`의 본문 주석, Edge Function의 정본 표시, `docs/4-test/execution.md`의 실행 예시 한 줄. **고쳐야 하는 것들이다**
- **합성 픽스처** — lint 규칙 테스트가 쓰는 `src/entities/cart/model/price.ts` 같은 가짜 경로. 실물이 없는 것이 정상이다
- **완료된 plan의 기록** — 당시 자리를 적은 것이라 [3-build 안내](../3-build/README.md#구현-계획)가 소급 변경을 막는다

## 볼 자리

검사를 세운다면 첫째 묶음만 봐야 하는데, **셋을 글자로 가를 수 없다.** 쓸 수 있는 선은 「`src/` 아래 소스 주석이 가리키는 `src/` 경로는 실재해야 한다」다 — 둘째는 `tests/`와 `eslint-rules/`에 살아 범위 밖이고 셋째는 `docs/`에 살아 범위 밖이다. `tests/lint/`에 이미 같은 꼴의 검사 넷이 서 있어 자리는 있다.

## 원칙

**이름 규칙을 기계가 집행하면 그 이름을 부르는 글자도 기계가 봐야 한다.** 묶음 일곱이 옮기기를 전부 스크립트로 했는데 치환 범위가 import 하나였다 — 파일을 부르는 자리가 import·마크다운 링크·주석 셋인데 검사는 앞의 둘만 가지고 있다.
