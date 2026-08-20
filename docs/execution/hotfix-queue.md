# hotfix 대기 큐

`in_progress` task의 허용 경로 밖이라 커밋만 미뤄둔 수정. **수정 자체는 작업 트리에 이미 반영돼 있다.**
`in_progress`가 비는 task 경계에서 한 커밋으로 묶고 줄을 지운다.

- 2026-08-18 · `docs/workflow/WORKFLOW.md` · 화면 task 디스패치에 0번(publisher 읽기 전용 대조) 단계와 근거 두 문단 추가 · 사용자 승인 · P0-T48 진행 중이라 `docs/workflow/**`가 허용 경로 밖
- 2026-08-18 · `.claude/skills/hotfix/` · hotfix 스킬 신설 · `.gitignore`에 `!.claude/skills/hotfix/`와 큐 파일 무시 두 줄 · P0-T48 허용 경로 밖
- 2026-08-18 · `.claude/skills/publish-ui/SKILL.md` · 「시안은 디자인 시스템을 거스를 수 없다」 절 신설 · 사용자 승인 · P0-T48 허용 경로 밖
