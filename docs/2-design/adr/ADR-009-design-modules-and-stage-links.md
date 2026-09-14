# ADR-009 — 설계 단계 안은 업무 영역으로 묶고 단계 사이는 참조로 잇는다

2026-09-14에 정했다. [ADR-005](ADR-005-sdlc-stage-folders-and-artifact-chain.md)의 여섯 단계와 intent→spec→plan 사슬, spec 승인 관문은 그대로다. 바꾸는 것은 `2-design/` 안의 배치와 단계 사이의 참조 방식이다. 검토 근거는 [docs-sdlc-coherence 제안](../../proposals/docs-sdlc-coherence.md)이고, 실행 순서는 [plan](../../3-build/plans/docs-sdlc-coherence.md)이다.

## 결정

**설계는 최상위가 관심사가 아니라 업무 영역이다.** [ADR-004](ADR-004-domain-rules-home.md)가 연 `domain/`과 그 짝으로 세운 `architecture/`의 네 폴더(data-model·api·runtime·flows)를 `modules/<영역>/`으로 모은다. 영역은 account·schedule·attendance·payroll·swap·notification 여섯이다.

```
2-design/
  system/          시스템 전체의 원칙 — architecture·data-access·runtime·navigation, 복합 화면 screens/
  modules/<영역>/  README.md(용어·업무 규칙), design.md(데이터·API·실행 동작), screens/(화면 문서와 시안)
  design-system/   토큰·컴포넌트·문안 — 위치 유지
  spec/ · adr/     위치 유지
```

- `modules/<영역>/README.md`가 그 영역의 용어와 업무 규칙 정본이다. ADR-004의 「용어와 규칙을 같은 파일에 둔다」는 그대로고 집만 옮긴다
- `modules/<영역>/design.md`가 데이터·API·실행 동작을 **행위별로** 담는다. 같은 행위의 저장 대상·호출·권한·실패·캐시 갱신을 한 자리에서 읽는다
- 화면 문서와 시안은 그 화면을 소유한 영역의 `screens/`에 산다. 여러 영역에 걸치는 대시보드·승인함·통계는 `system/screens/`다
- 영역을 가로지르는 규칙은 `system/` 넷이 든다. 공통 원칙은 system이, 영역별 적용과 예외는 각 design이 소유한다

**단계 사이는 같은 작업 슬러그와 `sources` 참조로 잇는다.** spec은 intent와 이번에 적용하는 설계 조항을, plan은 spec을 frontmatter `sources`에 적는다. 업무 규칙에는 `### ATT-003`처럼 제목 자체가 식별자인 고정 ID를 붙여 제목이 바뀌어도 참조가 끊기지 않게 한다. 작업 상태는 backlog가, 기능 승인은 spec이, 제안 채택은 proposal이 소유하고 다른 문서는 그것을 복제하지 않는다.

**기준을 고치는 PR이 영향을 확인한다.** 규칙·설계 조항이 바뀌면 그것을 `sources`로 든 spec·plan과 관련 테스트를 같은 PR에서 고치거나, 영향이 없는 이유를 남기거나, 전환 작업을 연결한다.

## 왜

관심사가 폴더고 도메인이 파일인 배치는 한 회차가 한 폴더만 열게 하려는 것이었다(ADR-004, [architecture 안내](../architecture/README.md#가르는-축)). 실제로는 한 영역의 계약이 다섯 곳으로 갈라졌고, 같은 행위를 두 문서가 다르게 적어도 아무도 못 잡았다 — 연락처 수정의 저장 경로가 api와 runtime에서 달랐고, 「통신 지연」의 비교 기준이 domain과 runtime에서 달랐다. 한 회차가 여는 것은 관심사가 아니라 업무였다.

단계 사이의 연결도 파일명 슬러그 하나에 기대고 있었다. 어느 설계 조항이 어느 spec의 입력인지는 사람이 기억해야 했고, 규칙을 고칠 때 영향받는 spec을 기계가 알 길이 없었다.

## 검토한 대안

- **현행 구조에 링크와 영향 검토만 보강** — 이동이 작지만 같은 업무의 설계가 여러 갈래에 남는다. 위 두 불일치가 다시 난다
- **단계 안 설계를 거대한 파일 하나로** — 상세 화면과 공통 기준이 섞이고 변경 충돌이 커진다

## 함께 정한 것

- 문서 지도의 정본은 `docs/README.md`로 옮긴다. CLAUDE.md와 루트 README는 그 입구를 링크한다
- 업무별 폴더는 `2-design`에만 둔다. intent·spec·plans는 작업 슬러그로 찾는 평면 목록을 유지한다
- 4-test·5-deploy·6-maintain은 단계를 유지하고 파일 자리(strategy·execution·evidence, environments·procedure·releases, monitoring·response·metrics·incidents)만 지금 정한다. 배포·운영 내용은 첫 출시 준비 task가 채운다
- 규칙 문서와 design은 총괄이 쓴다는 ADR-004의 조항은 그대로다. 이번 이동의 문장 옮기기는 subagent가 하되 문장을 지우거나 바꿔 쓰지 않는다

## 남는 위험

영역 하나를 통째로 읽기는 쉬워지고, 관심사 하나를 가로질러 읽기는 어려워진다 — 캐시 키 전부를 보려면 design 여섯을 연다. `system/runtime.md`가 공통 원칙을 들고 각 design이 자기 키를 드는 것으로 값을 치른다.

`sources`는 링크 존재만 기계가 본다. 뜻이 맞는지는 리뷰와 테스트가 판단한다.
