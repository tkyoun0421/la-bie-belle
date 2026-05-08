---
name: ai-harness-capture
description: 이 프로젝트에서 작업 중 떠오른 아이디어, 버그, 운영 작업, 하네스 개선을 즉시 GitHub Issue로 등록하고 단일 GitHub Project의 Inbox로 관리해야 할 때 사용한다. 기본 프로젝트 필드는 MVP=Backlog, Type=Idea, Source=Ad-hoc, Status=Inbox로 두고 triage 전 구현하지 않는다. PRD 기반 작업이 아닌 수시 발생 작업을 이슈화하거나 GitHub Project 필드 초안을 정리할 때 사용한다.
---

# AI 하네스 캡처

수시로 떠오른 작업을 잃지 않기 위해 즉시 GitHub Issue로 등록하고, 단일 GitHub Project의 Inbox에서 triage되도록 정리한다.

## 목적

- 메인 PRD/MVP 작업과 수시 발생 작업을 섞지 않는다.
- 떠오른 작업을 대화나 메모에 방치하지 않고 GitHub Issue로 남긴다.
- GitHub Project 필드 기본값을 일관되게 붙인다.
- triage 전에는 구현하지 않는다.

## 기본 분류

- `MVP`: `Backlog`
- `Type`: `Idea`
- `Source`: `Ad-hoc`
- `Status`: `Inbox`
- `Priority`: 비워두거나 사용자 판단이 있으면 `P0`, `P1`, `P2`, `P3` 중 하나

## Type 기준

- `Product`: PRD나 MVP 흐름에 직접 연결되는 제품 기능
- `Bug`: 재현 가능한 문제
- `Ops`: 문서, 설정, 개발환경, 배포, 운영 작업
- `Harness`: `.agents/**`, 스킬, 프롬프트, 루브릭, 평가, 대시보드 작업
- `Idea`: 아직 문제/범위/완료 기준이 정리되지 않은 아이디어

## Source 기준

- `PRD`: `docs/product/prd.md`에서 내려온 작업
- `Ad-hoc`: 작업 중 새로 떠오른 작업
- `Review`: 리뷰나 검증 중 발견된 후속 작업
- `User Feedback`: 실제 사용자 피드백에서 나온 작업

## 절차

1. 캡처 내용 확인
   - 사용자가 말한 작업을 한 문장으로 요약한다.
   - 구현 가능한 수준으로 명확하지 않아도 이슈화할 수 있다.

2. 이슈 초안 작성
   - 제목은 짧고 행동 중심으로 쓴다.
   - 본문에는 배경, 현재 아이디어, 기대 효과, 아직 모르는 점, triage 질문을 포함한다.
   - 기본 필드는 `MVP=Backlog`, `Type=Idea`, `Source=Ad-hoc`, `Status=Inbox`로 제안한다.

3. 사용자 승인
   - 저장소에 실제 GitHub Issue를 생성하기 전에는 초안을 보여주고 승인받는다.
   - 사용자가 "바로 만들어"처럼 명시하면 생성할 수 있다.

4. GitHub Project 반영
   - 이슈 생성 후 단일 제품 로드맵 Project에 추가한다.
   - 프로젝트 필드는 초안의 기본값으로 설정한다.
   - Project 접근 권한이나 번호가 없으면 필요한 값만 사용자에게 묻는다.

5. 다음 단계 안내
   - Inbox 이슈는 triage 전 구현하지 않는다.
   - MVP 작업으로 승격되면 `MVP`, `Type`, `Priority`, `Status`를 갱신하고 `ai-harness-plan`으로 넘긴다.

## 출력 형식

```md
캡처 이슈 초안

제목:

본문:

Project 필드:
- MVP:
- Type:
- Source:
- Status:
- Priority:

확인 필요:
이 초안으로 GitHub Issue를 생성할까요?
```

## 금지

- 사용자 승인 없이 GitHub Issue를 생성하지 않는다.
- Inbox 이슈를 바로 구현하지 않는다.
- PRD에 없는 내용을 MVP 확정 범위로 승격하지 않는다.
- GitHub Project 필드 값을 추측해서 실제 원격 프로젝트에 반영하지 않는다.
