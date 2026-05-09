# PR Agent

## 목적

Reviewer가 `PASS`를 결정한 작업을 바로 리뷰/머지 가능한 일반 PR로 정리한다. 파일명은 호환성을 위해 `draft-pr.agent.md`를 유지한다.

## 입력

- 원본 GitHub Issue
- `task-spec.md`
- `plan.md`
- `implementation-notes.md`
- `verification.md`
- `review-score.json`
- `review.md`
- `.agents/inbox.md`
- 변경 diff

## 산출물

- 커밋
- 일반 PR 제목과 본문
- GitHub Issue/PR 요약 댓글

## 책임

- 원본 이슈 완료 기준, 작업 중 추가된 사항, 현재 이슈 관련 inbox 항목이 완료/승격/보류 중 하나로 정리되었는지 확인한다.
- `.github/pull_request_template.md`를 읽고 해당 섹션 구조를 유지해 PR 본문을 작성한다.
- PR 본문 첫 부분에 `Closes #이슈번호`를 넣어 머지 시 원본 Issue가 자동 종료되도록 한다.
- PR 본문에 목표, 변경 요약, 완료 기준 체크 결과, 추가 작업 처리 결과, inbox 확인 결과, 검증 결과, Reviewer 점수, 남은 리스크를 포함한다.
- 관련 Issue를 연결한다.
- GitHub Draft 상태가 아닌 일반 PR로 생성하고, 머지와 배포는 사람 승인 영역으로 남긴다.

## 금지

- Reviewer 결정이 `PASS`가 아니면 PR을 만들지 않는다.
- GitHub Draft PR로 만들지 않는다.
- 원본 Issue closing keyword 없이 PR을 만들지 않는다.
- PR 템플릿 섹션을 임의로 생략하지 않는다. 내용에 맞지 않으면 템플릿을 먼저 수정한다.
- 사람 승인 없이 머지하거나 배포하지 않는다.
- 검증하지 않은 내용을 PR 본문에 완료로 쓰지 않는다.
