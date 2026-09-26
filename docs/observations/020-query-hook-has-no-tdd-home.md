---
status: open
target: .claude/agents/test-planner.md
date: 2026-09-27
resolved:
---

# 서버 상태 훅이 살 자리를 TDD 훅이 막는다

## 일

`members-pending`의 implementer가 `useQuery`를 못 앉혔다. `house/dumb-ui`가 `.tsx`에서 `useQuery`·`useMutation`을 막고(ADR-001 — 화면은 서버 상태를 직접 읽지 않는다), 그 훅이 살 `.ts`(`useMembers.ts` 같은 것)는 짝 unit 테스트가 없으면 `tdd-guard-unit.py`가 파일 쓰기를 막는다. `test-planner`가 그 테스트를 배정하지 않아 저장소 규칙 안에 훅을 둘 자리가 없었고, implementer는 `useEffect` + DAL 호출을 `.tsx` 안에 두는 쪽으로 피했다 — `dumb-ui`가 DAL 함수 호출은 안 잡아서다. `profile-form`(#416)에서도 같은 이유로 `QueryClientProvider`를 다음 task로 넘겼다. 두 번째다.

결과는 규칙의 취지가 새는 것이다. 화면 파일이 읽기·다시 읽기·실패 상태를 직접 굴리고, 캐시 키(`['members']`)와 무효화(design.md 「캐시 갱신」)가 코드에 없다.

## 고침

`test-planner` 정의문에 「화면이 서버 상태를 읽으면 그 훅(`src/features/<영역>/model/use<이름>.ts`)의 unit 테스트를 배정한다 — `renderHook` + `QueryClientProvider` 래퍼, DAL은 대역」을 넣는다. 세 번째가 나오기 전에 넣는 것이 낫다 — 두 번째에서 이미 화면 둘이 그 패턴 밖에 섰다. `members-pending`·`pending`의 `useEffect` 읽기는 다음 화면 task가 훅 꼴을 세울 때 같은 꼴로 옮긴다.

## 원칙

규칙 둘이 만나 빈 자리를 만들면 worker는 규칙이 안 보는 길로 간다. 막는 규칙을 세울 때 그것이 밀어내는 코드가 어디로 가야 하는지, 그 자리에 TDD 짝이 생기는 경로가 있는지를 같이 본다.
