# 하네스 인코딩 및 언어 가이드

하네스는 Markdown, JSON, JavaScript 파일을 UTF-8로 저장한다.

## PowerShell 표시

PowerShell 출력에서 한국어가 깨져 보이면 파일을 고치기 전에 현재 세션 출력 인코딩을 먼저 맞춘다.

```powershell
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [Console]::OutputEncoding
chcp 65001
```

이 설정은 현재 셸 표시만 바꾸며 파일을 다시 쓰지 않는다.

## 작성 규칙

- 하네스 Markdown, JSON, JavaScript 파일은 UTF-8로 저장한다.
- 하네스 문서, 스킬, 프롬프트, 평가 산출물의 설명 문장은 기본 한국어로 작성한다.
- `review-score.json`, `harness-health-score.json`, `harness-improvements.md`, 개선 제안 파일의 근거, 감점 사유, 요약, 권장 다음 작업은 한국어로 작성한다.
- 파일명, JSON 키, 상태값, 명령어, 코드 식별자, 라이브러리명은 원문 영어를 유지할 수 있다.
- 사용자가 영어 작성을 명시적으로 요청한 경우에만 영어 설명 문장을 사용한다.
- 한국어 내용을 옮길 때 손실 있는 콘솔 복사/붙여넣기를 피한다.

## 검증

인코딩 문제가 의심되면 다음 읽기 전용 확인을 먼저 사용한다.

```powershell
Get-Content .agents/harness/README.md -Raw
git diff -- .agents/harness/README.md
```

`git diff`에서는 정상인데 `Get-Content`에서만 깨져 보이면 파일 문제가 아니라 셸 출력 인코딩 문제일 가능성이 높다.

## 마이그레이션 규칙

깨진 운영 문서를 정리할 때는 손상된 조각만 이어 붙이지 말고, 작은 문서는 전체를 UTF-8 한국어 문서로 다시 쓴다. 제품 문서는 원문 의미가 확인된 경우에만 다시 쓴다.
