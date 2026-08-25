# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 총괄이 덮어쓴다.

## 지금 상태

2026-08-25에 3차 협업 구조를 확정하고 뼈대를 main에 merge했다(PR #153). 총괄 단일 세션, 결정=총괄·생산=subagent 원칙으로 간다 — 상세는 CLAUDE.md. main protection이 켜져 있어 모든 변경은 PR을 탄다. CI는 아직 없다.

## 다음 첫 수

프로젝트 스캐폴드. Next.js + shadcn/ui + Tailwind를 세우고, CI(build·lint·test)를 만들어 protection의 필수 검사로 연결한다.

## 열린 결정

- 디자인 시안 방향 — 사람이 레퍼런스를 검토한 뒤 정한다
- CI 구체 명령 구성 — 스캐폴드 회차에서 정한다

## 주의

- 저장소는 PUBLIC이다. 시크릿 커밋 금지, pre-commit 스캔이 있다.
- clone이나 worktree를 새로 만들면 `git config core.hooksPath .githooks`를 실행한다.
