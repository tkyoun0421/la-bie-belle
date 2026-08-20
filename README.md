# 라비에벨 근무 관리

라비에벨 웨딩홀의 근무 신청, 포지션 배정, 출퇴근 기록, 예상 급여를 관리하는 모바일 PWA입니다.

제품 범위와 구현 순서는 다음 문서에서 관리하며, 현재 구현 상태는 작업 인덱스를 기준으로 확인합니다.

- [문서 지도](docs/README.md)
- [5단계 개발 파이프라인 운영 계약](docs/workflow/WORKFLOW.md)
- [handoff 계약](docs/workflow/HANDOFF.md)
- [제품 요구사항](docs/product/PRD.md)
- [도메인 언어와 경계](docs/product/DOMAIN.md)
- [제품 디자인 시스템](docs/product/DESIGN.md)
- [시스템 아키텍처](docs/standards/ARCHITECTURE.md)
- [개발 컨벤션](docs/standards/DEVELOPMENT.md)
- [Architecture Decision Records](docs/standards/adr/README.md)
- [Phase 실행 계획](docs/execution/phases/README.md)
- [기계 판독용 작업 인덱스](docs/execution/phases/index.jsonl)

## 한눈에 보기

전체 흐름은 [프로젝트 지도](https://excalidraw.com/#json=SnTVqu6-OZixkWHRyvuU_,98oSmvZcsWwNnx3TTcN5Xg)에서 시작합니다. 세부 다이어그램은 실제 코드·설정·DB 마이그레이션을 기준으로 나눴습니다.

| 다이어그램 | 다루는 내용 | 원본 |
| --- | --- | --- |
| [프로젝트 지도](https://excalidraw.com/#json=SnTVqu6-OZixkWHRyvuU_,98oSmvZcsWwNnx3TTcN5Xg) | 제품 목표 → 승인·실행 → 문서·코드 계층 → 도메인 흐름 | [`overview.excalidraw`](diagrams/overview.excalidraw) |
| [협업 프로세스](https://excalidraw.com/#json=j9VdJTLx6ZOnNPh9rkv7H,oA2sSpwdW7Q8YhQVD0_kbg) | 5단계 파이프라인, 승인 게이트, worker, `pnpm verify` | [`process.excalidraw`](diagrams/process.excalidraw) |
| [프로젝트 구조](https://excalidraw.com/#json=p0nD94rDYDxwCxLLj8m8Z,Ef4_bEA-ZkWNIblfIsd90g) | L1~L5 문서 레이어, FSD import 방향, 도메인 경계 | [`structure.excalidraw`](diagrams/structure.excalidraw) |
| [진입점·요청 흐름](https://excalidraw.com/#json=pYg5zKc_Ie3dTgBV2-lWt,MsyJNUQvb_zUJv86TryCDw) | proxy·인증 진입, server-first 조회, Server Action 변경 | [`request-flow.excalidraw`](diagrams/request-flow.excalidraw) |
| [데이터 모델·저장 계층](https://excalidraw.com/#json=5rf0zsaaf5XmA0g6nlpfs,qOTjKaO2zj14Ki2LQ07AZQ) | TypeScript 모델, Identity·Scheduling·Notifications 테이블, RLS·RPC | [`data-storage.excalidraw`](diagrams/data-storage.excalidraw) |
| [외부 연동·설정](https://excalidraw.com/#json=2uuvJIxYgU53yOYHZgAi-,hVOSXa1kT0M1ztS0tfu9Ig) | Google OAuth, Supabase, Web Push, server/client 환경변수 | [`integrations-config.excalidraw`](diagrams/integrations-config.excalidraw) |
| [빌드·테스트 흐름](https://excalidraw.com/#json=SR6d-_B6_ZlabSEBVVorw,73PVjQjifSz2PPHIufLsPQ) | Git 훅, `pnpm verify`, Playwright, pgTAP, CI 두 job | [`build-test.excalidraw`](diagrams/build-test.excalidraw) |

CLI로 다시 만들 수 있는 다이어그램은 같은 이름의 `.elements.json` 입력 파일을 `diagrams/`에 함께 둡니다.

공유 링크는 읽기 모드로 시작하고 모든 요소가 잠겨 있습니다. excalidraw.com에 작업 중인 로컬 캔버스가 있으면 공식 앱이 교체 확인창을 띄우므로, 기존 화면을 보존하려면 새 창이나 시크릿 창에서 링크를 여세요.

## 문서 구조

문서는 5레이어로 나뉘며 위 레이어가 아래 레이어를 지배합니다. 근거는 [ADR-0013](docs/standards/adr/0013-project-layer-structure.md)입니다.

| 레이어 | 위치 | 책임 |
| --- | --- | --- |
| L1 협업 | `CLAUDE.md`, `.claude/`, `docs/workflow/` | 작업 방식, 단계, 승인, handoff |
| L2 제품·도메인 | `docs/product/` | 무엇을 왜 만드는가 |
| L3 기술 기준 | `docs/standards/` | 공통 기술 기준과 되돌리기 어려운 결정 |
| L4 계획·실행 | `docs/execution/` | 무엇을 언제 하는가, 실행 상태와 증거 |
| L5 코드 | `src/`, `tests/` (미래) | 실제 구현과 테스트 |

## 협업 방식

모든 작업은 **기획 → 설계 → 개발 → 검증 → 리팩토링** 5단계를 순서대로 지납니다. 사용자는 기획 단계에서 무엇을 왜 만들지, 설계 단계에서 RADIO로 어떻게 만들지를 각각 승인합니다. 두 승인을 받은 task만 개발·검증·리팩토링 단계로 넘어가며, AI는 승인된 설계를 임의로 확장하지 않습니다.

사용자 통제 지점은 매 task의 실행 지시가 아니라 이 두 승인 게이트입니다. 승인을 마친 task는 개발 루프가 `planned` 큐가 빌 때까지 의존성 순서로 연속 처리하며, `in_progress`는 언제나 하나입니다. 새 결정이 필요하거나 재시도 한도를 넘긴 task는 `blocked`로 두고 의존 관계가 없는 다음 task로 계속 진행한 뒤, 루프가 끝날 때 결과와 `blocked` 목록을 한 번에 보고합니다.

단계 경계마다 [handoff](docs/workflow/HANDOFF.md)를 기록해 세션이 끊겨도 이어서 진행할 수 있게 합니다.

현재 미구현 제품 계획은 기획 단계에서 검토할 `proposed` 기준안입니다. 기획 승인 후 설계를 기다리는 task는 `design_pending`, 두 승인이 모두 끝난 실행 가능 task는 `planned`입니다.

## MVP 성공 기준

다음 달 스케줄 모집부터 기존 단체 채팅과 수기 배정표를 완전히 대체한다.

## 문서 책임과 충돌 처리

- 제품 동작, 범위, 불변 규칙, 제품 인수 조건은 PRD가 기준입니다.
- 공통 언어, 도메인 경계, aggregate 일관성 경계는 Domain 문서가 기준입니다.
- 되돌리기 어려운 기술·데이터·운영 결정은 승인된 ADR이 기준입니다.
- Architecture는 승인된 PRD, Domain, ADR을 구현 구조로 반영합니다.
- Development는 공통 `DEV-*` 컨벤션과 RADIO 작성 규칙의 기준입니다.
- task별 승인된 RADIO는 해당 구현의 기술 설계 기준입니다.
- Design은 승인된 제품 규칙을 화면 구조, 상호작용, 시각 토큰과 역할별 흐름으로 반영합니다.
- Phase 문서는 구현 범위와 상세 인수 조건, `index.jsonl`은 실행 상태·의존성·검증 항목을 관리합니다.

이 문서들은 [운영 계약](docs/workflow/WORKFLOW.md)에 따라 각 단계에서 승인된 범위만 신규 구현의 기준이 됩니다.

서로 다른 책임의 문서가 충돌하면 임의로 우선 적용하지 않습니다. 구현을 멈추고 PRD부터 Domain, ADR, Architecture, Development·RADIO, Phase, 작업 인덱스 순서로 정합하게 수정합니다.

## 실행 도구

기존 하네스는 구조 재편 과정에서 제거되었습니다. 5단계 파이프라인을 강제하는 새 실행 하네스와 명령은 P0-T31에서 다시 만듭니다. 그때까지 단계 순서와 승인 게이트는 문서 계약으로 지킵니다.
