# Architecture Decision Records

ADR은 구현자가 임의로 바꾸면 데이터 호환성, 보안 또는 운영 방식에 큰 영향을 주는 결정을 기록합니다.

| ADR | 결정 | 상태 |
| --- | --- | --- |
| [0001](0001-nextjs-supabase-vercel.md) | Next.js, Supabase, Vercel 기반 운영 | Accepted |
| [0002](0002-authorization-boundaries.md) | RLS와 서버 트랜잭션으로 권한 강제 | Accepted |
| [0003](0003-schedule-lifecycle-and-snapshots.md) | 모집과 확정 상세를 분리하고 확정값 스냅샷 | Accepted |
| [0004](0004-immutable-attendance-events.md) | 출퇴근을 서버 시각 append-only 사건으로 저장 | Accepted |
| [0005](0005-transactional-notification-outbox.md) | 앱 내 알림과 푸시에 outbox 사용 | Accepted |
| [0006](0006-estimated-pay-not-payroll.md) | 급여는 스냅샷 기반 예상치로만 제공 | Accepted |
| [0007](0007-offboarding-and-history-recovery.md) | 탈퇴 정보 분리 보관과 관리자 복구 연결 | Accepted |
| [0008](0008-fsd-server-first-development-guards.md) | FSD, server-first, RADIO 개발 가드 | Accepted |
| [0009](0009-two-track-interview-and-engineering-loop.md) | 딥인터뷰 설계와 자율 개발 루프 분리 | Superseded (ADR-0013) |
| [0010](0010-dormancy-and-automatic-account-lifecycle.md) | 휴면과 자동 계정 생명주기 | Accepted |
| [0011](0011-planning-radio-development-contract.md) | 기획 승인, RADIO 개발 설계와 개발 컨벤션 계약 | Accepted |
| [0012](0012-static-operations-dashboard.md) | 정적 운영 대시보드의 안내·최신화 계약 | Accepted (revision 2) |
| [0013](0013-project-layer-structure.md) | 5레이어 프로젝트 구조와 5단계 개발 파이프라인 | Accepted |
| [0014](0014-fsd-view-layer-naming.md) | FSD 화면 조합 계층 이름 `views` | Accepted |
| [0015](0015-motion-library-scope.md) | 인터랙션 라이브러리를 `motion`의 `LazyMotion` 범위로 제한 | Accepted |

일부 ADR은 폐기되지 않은 채 뒤의 ADR에 부분 대체되었습니다. 충돌하면 뒤의 ADR이 기준입니다.

| 원 ADR | 부분 대체한 ADR | 대체된 범위 |
| --- | --- | --- |
| [0009](0009-two-track-interview-and-engineering-loop.md) | [0011](0011-planning-radio-development-contract.md) | 설계 트랙을 기획 인터뷰와 RADIO 개발 인터뷰로 세분화 |
| [0009](0009-two-track-interview-and-engineering-loop.md) | [0013](0013-project-layer-structure.md) | 트랙 명칭 → 5단계 파이프라인, 단일 task 실행·정지 → 연속 루프 |
| [0011](0011-planning-radio-development-contract.md) | [0013](0013-project-layer-structure.md) | 문서 위치와 단계 이름 |
| [0008](0008-fsd-server-first-development-guards.md) | [0014](0014-fsd-view-layer-naming.md) | FSD 화면 조합 계층 이름 `pages` → `views`, 계층 디렉터리 선생성 요구 제거 |

## 상태

- `Proposed`: 논의 중이며 구현 근거로 사용하지 않는다.
- `Accepted`: 현재 구현 기준이다.
- `보류(재검토 예정)`: 결정 자체는 폐기하지 않았으나 선행 구조 변경 때문에 현재 구현 근거로 사용하지 않는다. 재검토 후 `Accepted` 또는 `Superseded`로 확정한다.
- `Superseded`: 새 ADR로 대체되었다.
- `Deprecated`: 더 이상 적용하지 않는다.

Accepted ADR을 변경할 때 기존 문서를 덮어쓰지 않고 새로운 ADR을 작성한 뒤 `Superseded by ADR-NNNN`으로 연결합니다.
