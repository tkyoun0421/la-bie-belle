# Handoff

새 총괄 세션은 이 파일부터 읽는다. 회차가 끝날 때마다 총괄이 덮어쓴다.

## 지금 상태

2026-08-25에 3차 협업 구조 확정(PR #153~#155)과 프로젝트 스캐폴드(PR #156)까지 끝났다. Next.js + Tailwind + shadcn/ui가 서 있고, build·lint·test·e2e를 도는 `ci` job이 branch protection 필수 검사로 걸려 있다 — 빨간불이면 merge가 막힌다. 모든 변경은 PR을 탄다.

## 다음 첫 수

PRD 작성. 사람과 제품 인터뷰로 요구를 확정한다. 완료 조건은 `docs/plan.md`에 있다. 그다음이 디자인 레퍼런스 검토다.

## 열린 결정

- 디자인 시안 방향 — 사람이 레퍼런스를 검토한 뒤 정한다

## 주의

- 저장소는 PUBLIC이다. 시크릿 커밋 금지, pre-commit 스캔이 있다.
- clone이나 worktree를 새로 만들면 `git config core.hooksPath .githooks`를 실행한다.
- shadcn CLI 기본 preset(base-nova)이 Radix 대신 `@base-ui/react` 기반으로 바뀌었다. 디자인 시스템 방향 결정 때 참고.
