# task별 RADIO 개발 설계

이 디렉터리는 설계 단계에서 승인한 task별 기술 설계의 정본이다. 공통 규칙은 [개발 컨벤션](../../standards/DEVELOPMENT.md)을 참조하고 반복하지 않는다.

## 파일과 상태

- 파일명은 `<task-id>-radio.md`를 사용한다.
- 문서에 1부터 시작하는 `revision`과 `Draft | Approved | Superseded` 상태를 기록한다.
- task가 `design_pending`일 때 초안을 작성한다.
- 사용자 승인 후 정확한 파일 전체의 SHA-256과 revision을 `development_approval`, 경로를 `radio_ref`에 기록하고 `planned`로 바꾼다.
- 승인 후 의미가 바뀌면 고정 경로에서 revision을 증가시키고 `Draft`로 바꾼 뒤 설계 단계에서 재승인한다. 이전 revision은 Git 이력으로 보존한다.
- 상위 결정 변경으로 설계 전제가 무너져 개발 승인이 철회되면 문서를 `Superseded`로 표시하고 무효 사유를 적는다. 본문은 역사 기록으로 보존하고 `index.jsonl`에서 `development_approval`과 `radio_ref`를 제거한다. 새 설계는 같은 경로에 새 revision으로 작성한다.
- 여러 task에 영향을 주거나 되돌리기 어려운 결정은 ADR로 승격한다.
- `docs/execution/runs/<task-id>/radio.md`는 이 문서의 대체물이 아니라 실행 결과와 차이 증거다.

## 적용 상태

각 관련 `DEV-*` 규칙은 다음 상태 중 하나를 가진다.

- `기본 적용`: 공통 규칙을 그대로 따른다.
- `해당 없음`: 작업 범위에 적용되지 않는다.
- `추가 결정`: 작업별 기술 선택과 근거를 기록한다.
- `예외`: `SHOULD` 규칙의 예외와 위험·보완책·되돌림 조건을 기록한다.

`MUST` 규칙은 task에서 예외 처리할 수 없다.

## 템플릿

```md
# <task-id> RADIO 개발 설계

- 상태: Draft | Approved | Superseded
- revision:
- 기획 승인:
- 개발 설계 승인:
- 관련 spec:
- 적용 깊이: 간결 | 일반 | 심화

## Requirements

- 범위와 비목표:
- 불변 규칙:
- 기술 인수 조건:
- 위험 기반 테스트:
- DEV-* 적용 상태:

## Architecture

- 책임과 FSD 경계:
- 서버·보안 경계:
- Clean Code·SOLID·재사용:
- DEV-* 적용 상태:

## Data model

- 정본과 파생 데이터:
- schema·RLS·migration:
- 트랜잭션·멱등성·동시성:
- 감사·보존·복구:
- DEV-* 적용 상태:

## Interface

- 입력·DTO·Result:
- cache·offline:
- 외부 계약·실패:
- DEV-* 적용 상태:

## Optimizations

- 기본값 유지 또는 최적화 근거:
- 관측성:
- 의존성:
- 복잡도·되돌림:
- DEV-* 적용 상태:

## 미결 사항

없음 | 목록
```
