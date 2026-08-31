# 프론트매터 필드

## 목차

- [핵심 — 배포처가 허용 필드를 정한다](#핵심--배포처가-허용-필드를-정한다)
- [표준 스펙 필드](#표준-스펙-필드)
- [Claude Code 확장 필드](#claude-code-확장-필드)
- [name을 생략할 수 있는 자리](#name을-생략할-수-있는-자리)
- [자주 나는 사고](#자주-나는-사고)

## 핵심 — 배포처가 허용 필드를 정한다

같은 SKILL.md라도 어디에 놓느냐에 따라 통하는 필드가 다르다.

| 배포처 | 허용 필드 |
|---|---|
| Claude Code 로컬 (`~/.claude/skills/`, `.claude/skills/`, 플러그인) | 표준 2개 + 확장 필드 전부 |
| claude.ai 업로드, Skills API, `.skill` 패키징 | 여섯 개만 — `name`, `description`, `allowed-tools`, `compatibility`, `license`, `metadata` |

여섯 개 밖의 필드를 넣고 패키징하면 경고가 아니라 하드 에러로 실패한다. 로컬에서 잘 돌던 스킬이 배포 단계에서 막히는 사고가 여기서 난다. 그러니 내보낼 계획이 있는 스킬은 처음부터 여섯 개 안에서 쓴다.

## 표준 스펙 필드

### name (필수)

- 최대 64자
- 소문자, 숫자, 하이픈만
- XML 태그 금지
- `anthropic`과 `claude`는 예약어라 못 쓴다
- 디렉터리 이름과 맞춘다

동명사꼴을 권한다 — `processing-pdfs`, `analyzing-spreadsheets`. `helper`, `utils`, `tools` 같은 이름은 무엇을 하는지 안 알려줘서 피한다.

### description (필수)

- 비면 안 된다
- 최대 1,024자
- XML 태그 금지
- 3인칭으로 쓴다

무엇을 하는지와 언제 쓰는지를 둘 다 담는다. 자세한 작성법은 SKILL.md 본문에 있다.

### allowed-tools (선택)

이 스킬이 도는 턴 동안 권한을 다시 묻지 않고 쓸 도구 목록이다. 스킬이 매번 같은 승인 창을 띄우게 만들 때만 쓴다.

### compatibility (선택)

필요한 도구나 의존성을 적는 문자열. 최대 500자다.

### license, metadata (선택)

`license`는 라이선스 표기, `metadata`는 자유 형식 YAML map이다. 둘 다 동작에 영향을 주지 않는다.

## Claude Code 확장 필드

로컬 스킬에서만 통한다. 전부 선택이고, 정본은 Claude Code 공식 문서의 "Frontmatter reference" 표다.

| 필드 | 하는 일 |
|---|---|
| `when_to_use` | 언제 부를지를 description과 따로 적는다. 둘을 합친 길이가 1,536자에서 잘린다 |
| `argument-hint` | `/skill-name` 으로 부를 때 보여줄 인자 힌트 |
| `arguments` | 인자 이름 |
| `disable-model-invocation` | `true`면 Claude가 알아서 이 스킬을 열지 않는다. 사용자가 직접 부를 때만 뜬다 |
| `user-invocable` | 기본 `true`. `false`면 사용자가 `/`로 못 부른다 |
| `disallowed-tools` | 이 스킬이 도는 동안 막을 도구 |
| `model` | 이 스킬을 돌릴 모델 |
| `effort` | 추론 강도 |
| `context` | `fork`를 주면 별도 컨텍스트에서 돈다 |
| `agent` | 이 스킬을 맡길 subagent |
| `background` | 백그라운드 실행 |
| `hooks` | 스킬에 걸 훅 |
| `paths` | 글롭 패턴. 해당 경로를 다룰 때만 걸리게 한다 |
| `shell` | 쓸 셸 |

`disable-model-invocation: true`와 `user-invocable: false`를 같이 주면 아무도 못 부르는 스킬이 된다. 둘을 함께 쓰지 않는다.

## name을 생략할 수 있는 자리

Claude Code 로컬 스킬은 `name`이 없으면 디렉터리 이름을 쓴다. 그래도 적어두는 편이 낫다 — 파일만 봐도 이름이 보이고, 나중에 패키징할 때 필수 필드라 어차피 채워야 한다.

## 자주 나는 사고

- **대문자나 밑줄이 섞인 `name`** — `PDF_Processor`는 로딩이 막힌다. `processing-pdfs`로 쓴다
- **description에 태그가 섞임** — 설명 안에 `<example>` 같은 걸 넣으면 XML 태그로 걸린다
- **확장 필드를 넣고 패키징** — 위 여섯 개 표를 다시 본다
- **description을 한 단어로** — "PDF 처리" 다섯 자로는 어떤 대화에서도 안 걸린다
