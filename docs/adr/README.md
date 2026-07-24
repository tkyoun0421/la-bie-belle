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
| [0009](0009-two-track-interview-and-engineering-loop.md) | 딥인터뷰 설계와 자율 개발 루프 분리 | Accepted |

## 상태

- `Proposed`: 논의 중이며 구현 근거로 사용하지 않는다.
- `Accepted`: 현재 구현 기준이다.
- `Superseded`: 새 ADR로 대체되었다.
- `Deprecated`: 더 이상 적용하지 않는다.

Accepted ADR을 변경할 때 기존 문서를 덮어쓰지 않고 새로운 ADR을 작성한 뒤 `Superseded by ADR-NNNN`으로 연결합니다.
