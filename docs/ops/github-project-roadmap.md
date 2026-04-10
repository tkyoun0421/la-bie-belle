# GitHub Project 로드맵 운영

이 문서는 이 저장소의 제품 개발을 GitHub Project, milestone, issue 중심으로 운영하기 위한 기준 문서다.

## 목표

- 현재 릴리즈 범위를 milestone으로 나눈다
- 각 milestone 아래에 실행 가능한 issue를 만든다
- issue와 PR이 GitHub Project에 자동으로 모이게 한다
- 구현은 문서뿐 아니라 ticket 기준으로 진행한다

## 기본 운영 규칙

- 새 작업은 milestone 없는 ad-hoc branch로 시작하지 않는다
- 먼저 issue를 만들고, PR은 해당 issue를 닫도록 연결한다
- 구현 단위는 `phase milestone -> issue -> phase PR` 순서로 간다
- issue 본문에는 배경, 목표, 기대 사용자 흐름, 포함/제외 범위, 영향 영역, 완료 조건, 테스트 계획, 리스크가 있어야 한다
- PR 본문에는 연결 이슈, 목적, 배경, 기대 사용자 흐름, 주요 변경, 포함/제외 범위, 영향 영역, TDD 기록, 검증 근거, 다음 단계, 리스크가 있어야 한다
- PR 본문에는 반드시 `Closes #...` 연결 이슈가 있어야 하고, 연결한 issue들은 모두 같은 milestone에 속해야 한다
- PR milestone은 linked issue의 milestone으로 자동 동기화된다
- TDD 규칙은 [CLAUDE.md](../../CLAUDE.md)와 [execution-plan.md](../plans/execution-plan.md)를 따른다
- 브랜치 전략은 `develop` 기준으로 운영한다

## 브랜치 전략

- 일상 구현 브랜치는 `develop`
- 구현은 기본적으로 `develop`에서 직접 진행한다
- phase가 끝나면 PR을 `develop -> master`로 올린다
- 하나의 PR은 하나의 phase만 다룬다
- `master`는 release 또는 배포 기준 브랜치로 유지한다

## 현재 릴리즈 Milestones

### 현재 릴리즈

이 문서에 적힌 milestone은 현재 릴리즈 기준이다. 이후 릴리즈도 같은 project와 같은 스크립트 구조를 계속 사용하고, 필요하면 별도 릴리즈 라벨을 추가해서 분기한다.

### Phase 1. Event + Template

- Slice 1. 행사 템플릿 기반
- Slice 2. 매니저 행사 생성

### Phase 2. Application + Assignment

- Slice 3. 멤버 행사 신청과 취소
- Slice 4. 매니저 멤버 배정

### Phase 3. Replacement

- Slice 5. 배정 취소와 대타 요청 생성
- Slice 6. 대타 지원과 승인

### Phase 4. Check-in

- Slice 7. 체크인 검증과 예외 처리

### Phase 5. Payroll Preview

- Slice 8. 급여 미리보기와 오버라이드 감사 로그

### Phase 6. Auth + PWA Onboarding

- Slice 9. Google 로그인과 승인 대기 온보딩
- Slice 10. 디바이스와 푸시 구독 런치 게이트

## 포함된 파일

- [project-roadmap.seed.json](../../scripts/github/project-roadmap.seed.json): milestone, label, issue 시드
- [bootstrap-project-roadmap.ps1](../../scripts/github/bootstrap-project-roadmap.ps1): GitHub project, milestone, issue를 생성하는 스크립트
- [add-to-project.yml](../../.github/workflows/add-to-project.yml): `track:roadmap` 라벨이 붙은 issue/PR을 project에 자동 추가하는 workflow
- [sync-pr-milestone.yml](../../.github/workflows/sync-pr-milestone.yml): PR 본문의 linked issue를 기준으로 milestone을 자동 동기화하는 workflow
- [roadmap-work-item.yml](../../.github/ISSUE_TEMPLATE/roadmap-work-item.yml): 새 로드맵 이슈 작성 템플릿
- [PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md): 이슈 기반 PR 작성 템플릿

## 1. 초기 생성

프로젝트 루트 `.env.local.example`을 참고해서 `.env.local`을 만들고, 한 번만 실행하면 된다.

```powershell
GITHUB_TOKEN=YOUR_TOKEN
```

그리고 실행:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\github\bootstrap-project-roadmap.ps1
```

필요 권한은 최소한 아래 정도다.

- repository issues write
- repository metadata read
- repository variables write
- user projects read and write

이 스크립트가 하는 일:

- 사용자 project `La Bie Belle Product Roadmap` 생성 또는 재사용
- repo labels 생성
- repo milestones 생성
- seed issue 생성
- 생성한 issue를 project에 추가
- repo variable `ROADMAP_PROJECT_URL` 설정

## 2. 자동 추가 워크플로 활성화

`add-to-project.yml`은 repo secret `ROADMAP_PROJECT_TOKEN`이 있어야 동작한다.

필수 repo secret:

- `ROADMAP_PROJECT_TOKEN`: GitHub Project write 권한이 있는 PAT

필수 repo variable:

- `ROADMAP_PROJECT_URL`: bootstrap script가 자동으로 채운다

이후에는 `track:roadmap` 라벨이 붙은 issue와 PR이 자동으로 project에 들어간다.

## 3. 일상 작업 흐름

1. milestone에서 다음 issue를 고른다
2. issue 본문에 테스트 계획이 부족하면 먼저 보강한다
3. `develop`에서 phase 구현을 진행한다
4. phase 안의 slice를 모두 닫은 뒤 PR을 `master`로 올린다
5. PR 본문에 포함된 slice와 `Closes #번호` 목록을 넣는다
6. linked issue milestone이 PR milestone으로 자동 동기화되는지 확인한다
7. merge 후 project status를 다음 단계로 옮긴다

## 4. 원격 생성 전 점검

원격 생성 전에 seed만 확인하고 싶으면:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\github\bootstrap-project-roadmap.ps1 -DryRun
```

## 5. Repository Projects 탭에 보이게 하기

bootstrap으로 생성되는 project는 사용자 소유 GitHub Project다. 그래서 생성 직후에는 저장소의 `Projects` 탭에 자동으로 나타나지 않을 수 있다.

repo `Projects` 탭에도 보이게 하려면 둘 중 하나를 해야 한다.

1. 저장소 `Projects` 탭에서 `Link a project`로 `La Bie Belle Product Roadmap`을 연결한다
2. project 설정에서 `Default repository`를 `la-bie-belle`로 지정한다

둘 중 하나만 해도 저장소 `Projects` 탭에서 접근할 수 있다.

## 내가 직접 세팅해야 하는 것

### 반드시 필요한 것

- GitHub에 한 번 로그인된 상태
- 프로젝트 루트 `.env.local` 또는 현재 환경변수에 `GITHUB_TOKEN` 준비
- repo secret `ROADMAP_PROJECT_TOKEN` 추가

### 이미 자동화된 것

- milestone/issue 시드 구조
- project 자동 추가 workflow
- PR milestone 자동 동기화 workflow
- 이슈 템플릿
- PR 템플릿

## 라벨 운영

- `track:roadmap`: 메인 로드맵에서 추적하는 항목
- `track:current-release`: 현재 릴리즈 범위에 포함된 항목

이후 특정 릴리즈를 더 명확히 구분하고 싶다면 `release:v1.1`, `release:ops-hardening` 같은 라벨을 추가하면 된다.

## 참고

- 현재 저장소 원격은 `tkyoun0421/la-bie-belle` 기준으로 맞춰져 있다
- 현재 기본 흐름은 `track:roadmap`와 `track:current-release` 조합으로 운영한다
