# 규칙 15에 막혀 hook 안에 남은 함수가 제 자리로 간다

앞 묶음 둘이 꼴은 고치고 자리를 남겼다. 규칙 15(`.claude/hooks/tdd-guard-unit.py`)가 새로 내보내는 함수마다 짝 테스트를 먼저 요구하는데 `implementer`는 테스트를 안 쓰기 때문이다. 이 task는 **작성자가 먼저 짝을 세우고** 구현자가 옮긴다. 동작은 안 바뀐다.

## 입력 명세·기준

자리는 backlog 행이 셌다. 세그먼트 뜻은 [ADR-015](../../2-design/adr/ADR-015-read-write-layers-and-fixed-segments.md) — 판정·전이는 `model`, 순수 도구는 `utils`, hook은 controller만 든다.

## 옮길 것

| 지금 | 갈 곳 |
| --- | --- |
| `positionRank` 둘 — `entities/schedule/model/daySheet.policy.ts:19` · `features/stats/model/workTotals.policy.ts:128` | `entities/schedule/model/positionRank.policy.ts` 하나. `features/stats`가 `entities/schedule`을 당긴다 |
| `workTotals.policy.ts:134`의 `minutesOfTime` | 지우고 `shared/utils/kstDate.ts`의 `minutesOfClock`을 당긴다 — 몸이 같다(이름만 다르다) |
| `useRehearsalScreen`의 폼 판정(`form`) | `screens/rehearsal/model/` |
| `useScheduleWorkerScreen`의 `sheetOpenedOn` | `screens/scheduleWorker/model/` |
| `useAdminHomeScreen`의 타일 입력 계산 | `screens/adminHome/model/` |
| `useMemberRows`의 `emptyReasonOf` | `entities/member/model/` |
| `useMemberSheet`의 `memberSheetVisuals`·`refusalOf` | `features/memberAdmin/model/` |

hook 안 이름은 앞 묶음 뒤로 바뀌었을 수 있다 — 작성자가 hook을 읽어 지금 이름을 찾고 리턴에 적는다. 새 파일 이름은 ADR-015 접미사(판정은 `.policy.ts`)를 따른다.

**`positionRank`는 가드가 아니다** — 「몇째냐」를 묻는다. 순위 표(`POSITION_ORDER`)에 없는 포지션은 맨 뒤다. 두 복사본의 표가 같은지 작성자가 확인한다.

## 완료 조건

- **AC-01** 일곱이 표의 자리에 서고 hook 안에 같은 몸이 안 남는다
- **AC-02** 새 파일마다 짝이 그 이름을 부른다 — 지금 hook 테스트가 재던 단언은 그대로 초록
- **AC-03** 감사의 글자 해시 셈이 0집단이다(`positionRank`가 마지막이었다)
- **AC-04** `pnpm lint`·`pnpm typecheck`·`pnpm test` 초록
