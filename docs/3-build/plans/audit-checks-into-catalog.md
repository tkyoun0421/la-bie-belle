# 감사가 손으로 센 꼴을 기계가 센다

[감사](../../proposals/post-refactor-audit.md) 축 ⑧이 판정 없이 박을 수 있는 검사 일곱을 골랐다. 앞 묶음들이 자리를 줄였으니 남은 자리를 0으로 만들고 검사를 켠다. 거짓 양성이 남는 검사는 안 켠다 — 남으면 다음 사람이 `eslint-disable`로 덮는다.

## 입력 명세·기준

[ADR-015](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md)의 「집행」 표가 정본이다 — 넷이 새 줄로 섰고 검사 수가 스물셋이다. 규칙 번호는 [execution](../../4-test/execution.md)의 카탈로그가 들고 48부터다.

## 검사 일곱

| 꼴 | 자리 | 지금 남은 것 — 먼저 0으로 |
| --- | --- | --- |
| 접미사가 제 세그먼트에 사는가 | `tests/lint/fileNaming.ts` — ADR-015가 「본다」고 적었는데 검사가 없다. 접미사→세그먼트 표를 그 파일에 세운다 | 감사 셈 0 |
| `.type.ts`·`.dto.ts`에 클래스·변수·함수 선언 금지 | house 규칙 | `shared/model/error.type.ts`의 `DomainError`·`TransportError`. ADR-015 접미사 표에서 클래스가 사는 자리를 골라 옮긴다 — 표에 맞는 접미사가 없으면 `shared/model/errors.ts`처럼 접미사 없이 두고(「도메인이 없는 것은 안 붙인다」) 리턴에 적는다 |
| `services/`에서 `hooks/` import 금지 | house 규칙 | 0 — `api-exports-only-transport`가 치웠다 |
| `hooks/`에서 `use*`가 아닌 export 금지 | house 규칙(규칙 30의 역방향) | `screens/notifications/hooks/pressNotification.ts` — 순수 판정이면 `model/`, 부작용이면 `lib/`로 |
| 빈 `.catch(() => {})` 금지, 기기 손 허용 | house 규칙 | 허용 목록 밖 자리를 센다. 감사가 든 `getServerNow`·`getPushPermission`·`savePushToken`은 실패가 어디로 가야 하는지가 판정이라 **이 task가 판정하지 않는다** — 그 자리가 남으면 검사를 켜지 않고 리턴에 적는다 |
| 문서의 수(`docCounts`) | `tests/lint/docCounts` | ADR-015와 `CLAUDE.md`의 「검사 스물셋」이 집행 표 행 수와 같다 |
| 세그먼트 목록 하나 | `eslint-rules/segments.mjs`의 `SEGMENTS` | 규칙 넷(`constsSegment`·`dumbUi`·`nativeSdkSegment`·`uiValueImport`)이 부분집합을 각자 든다 — 하나에서 당긴다 |

규칙마다 짝 테스트(`eslint-rules/__tests__/`, `tests/lint/*.test.ts`)는 **작성자가 먼저** 쓴다 — 통과·실패 픽스처. 카탈로그 행(`docs/4-test/execution.md`)은 구현자가 더한다 — `ruleCatalogue.test.ts`가 규칙과 카탈로그를 맞춘다.

## 완료 조건

- **AC-01** 켠 검사마다 짝 테스트가 통과·실패 픽스처를 잰다
- **AC-02** 켠 검사가 저장소에서 0건이다 — `eslint-disable`을 새로 달지 않는다
- **AC-03** 켜지 못한 검사는 리턴과 PR 본문에 까닭이 있다
- **AC-04** `pnpm lint`·`pnpm typecheck`·`pnpm test` 초록
