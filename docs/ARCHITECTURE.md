# 라비에벨 시스템 아키텍처

- 상태: MVP 기준
- 기준일: 2026-07-23
- 관련 문서: [PRD](PRD.md), [Domain](DOMAIN.md), [ADR](adr/README.md), [Phase](phases/README.md)

## 1. 아키텍처 목표

- 모바일 PWA 하나로 근무자와 관리자 경험을 제공한다.
- 권한과 개인정보 접근을 데이터 계층에서도 강제한다.
- 출퇴근 원본 시각과 감사 기록을 변조할 수 없게 한다.
- 월 8개 스케줄 규모에서 운영 복잡도를 최소화한다.
- MVP 밖 기능을 위한 추상화를 미리 만들지 않는다.

## 2. 기술 구성

| 영역 | 선택 |
| --- | --- |
| 웹 애플리케이션 | Next.js App Router, TypeScript |
| UI | Tailwind CSS, shadcn/ui, 모바일 우선 |
| 인증 | Supabase Auth, Google OAuth |
| 데이터베이스 | Supabase PostgreSQL, Seoul 리전 |
| 권한 | PostgreSQL RLS, 보안 함수, 서버 전용 작업 |
| 푸시 | Service Worker, Web Push, VAPID |
| 예약 작업 | Supabase Cron, Edge Function |
| 호스팅 | Vercel |
| 테스트 | Vitest, Playwright, SQL/RLS 테스트 |

## 3. 시스템 컨텍스트

```mermaid
flowchart LR
  Worker[근무자 PWA]
  Admin[관리자 PWA]
  Google[Google OAuth]
  Web[Next.js on Vercel]
  Auth[Supabase Auth]
  DB[(PostgreSQL)]
  Cron[Supabase Cron]
  Push[Web Push Service]

  Worker --> Web
  Admin --> Web
  Web --> Google
  Web --> Auth
  Web --> DB
  Cron --> DB
  Cron --> Push
  Web --> Push
  Push --> Worker
  Push --> Admin
```

## 4. 애플리케이션 경계

### 브라우저

- 화면 표시, 폼 입력, 위치 권한 요청, QR 스캔, 푸시 구독을 담당한다.
- 클라이언트 시각은 출퇴근 원본으로 사용하지 않는다.
- UI에서 버튼을 숨기는 것만으로 권한을 보장하지 않는다.

### Next.js 서버 경계

- Google OAuth callback과 세션 처리를 담당한다.
- 관리자 변경, 배정 확정, 교대 승인처럼 여러 테이블을 원자적으로 변경하는 작업을 수행한다.
- VAPID 비밀키와 Supabase service role 키를 브라우저에 노출하지 않는다.
- 요청 사용자의 계정 상태와 역할을 다시 확인한다.

### 코드 구조와 개발 가드

- 구현의 FSD 계층, server-first 경계, RADIO 기록과 검증 흐름은 [개발 규칙](DEVELOPMENT.md)과 [ADR-0008](adr/0008-fsd-server-first-development-guards.md)을 따른다.

### PostgreSQL

- 도메인 데이터의 단일 진실 공급원이다.
- RLS로 행 단위 읽기·쓰기 권한을 강제한다.
- 트랜잭션 함수로 확정, 교대, 출퇴근 기록처럼 원자성이 필요한 변경을 수행한다.
- 출퇴근 원본과 감사 로그의 UPDATE/DELETE를 금지한다.
- 시간 저장은 `timestamptz`, 날짜 표현과 마감 계산은 `Asia/Seoul`을 사용한다.

### Cron과 Edge Function

- 마감일 종료, 예약 알림, 탈퇴 정보 만료를 처리한다.
- 알림 outbox를 읽고 Web Push를 발송한다.
- 재시도 횟수와 마지막 오류를 기록하며 중복 발송을 막는다.

## 5. 핵심 도메인 모델

공통 언어, 논리적 context, aggregate 경계는 [Domain 문서](DOMAIN.md)를 기준으로 한다. 아래 모델은 그 경계를 PostgreSQL 관계로 구현한 현재 구조다.

```mermaid
erDiagram
  auth_users ||--|| profiles : owns
  profiles ||--o{ user_roles : has
  profiles ||--o{ worker_position_eligibilities : qualifies
  positions ||--o{ worker_position_eligibilities : grants
  work_schedules ||--o{ schedule_applications : receives
  profiles ||--o{ schedule_applications : submits
  work_schedules ||--o{ ceremonies : contains
  work_schedules ||--o{ position_requirements : requires
  positions ||--o{ position_requirements : defines
  work_schedules ||--o{ assignments : assigns
  profiles ||--o{ assignments : works
  assignments ||--o{ assignment_positions : covers
  positions ||--o{ assignment_positions : covered_by
  assignment_positions ||--o{ trainee_links : mentors
  profiles ||--o{ trainee_links : trains
  work_schedules ||--o{ change_requests : receives
  work_schedules ||--o{ attendance_events : records
  profiles ||--o{ attendance_events : creates
  profiles ||--o{ rehearsal_entries : records
  profiles ||--o{ push_subscriptions : owns
  profiles ||--o{ notifications : receives
```

## 6. 주요 테이블

### 사용자와 권한

- `profiles`: 활성 프로필, 승인 상태, 이름, 휴대폰, 성별, 생년월일, 시급.
- `user_roles`: `worker`, `admin`, `super_admin`. 관리자는 worker 권한을 포함한다.
- `departed_profile_vault`: 탈퇴 후 3년간 분리·암호화한 복구 정보.
- `positions`: 이름, 기본 필요 인원, 성별 조건, 기본 포지션 여부.
- `worker_position_eligibilities`: 개인별 정식 수행 가능 포지션.

### 장소와 설정

- `venue_settings`: 단일 장소 좌표, GPS 반경, 정확도 한도, 기본 시급.
- `check_in_rules`: 첫 예식 시작 시각과 추천 출근 시각의 규칙표.
- `weekly_qr_keys`: 수요일 시작 주차와 QR 키 버전, 활성·만료 시각.

### 스케줄

- `work_schedules`: 근무일, 신청 마감일, 상태, 예정 출퇴근, 확정 시각.
- `schedule_applications`: 신청자, 신청 상태, 신청·철회 시각.
- `ceremonies`: 순서와 시작 시각.
- `position_requirements`: 스케줄별 포지션 필요 인원 스냅샷.
- `assignments`: 근무자별 하루 배정, 시급 스냅샷, 결근 상태.
- `assignment_positions`: 한 배정이 담당하는 복수 포지션.
- `trainee_links`: 교육생, 포지션, 담당 assignment position. 가능 포지션은 요구하지 않지만 성별 조건은 검사한다.

### 변경 요청과 알림

- `change_requests`: 취소, 특정 교대, 공개 교대의 상태와 선택 사유.
- `change_request_candidates`: 교대 후보, 참여·읽음 시각.
- `notifications`: 앱 내 알림과 읽음 상태.
- `notification_outbox`: 푸시 발송할 사건과 멱등성 키.
- `push_subscriptions`: 사용자별 복수 기기의 Web Push endpoint.

### 출퇴근

- `attendance_events`: `check_in`, `check_out` 원본 사건, 서버 시각, 인증 방식.
- `attendance_attestations`: 팀장 또는 관리자의 현장 확인과 결근 판정.
- `attendance_projection`: 원본 사건과 확인을 합성한 조회용 상태.

### 급여 참고

- 일반 근무 예상 급여는 `assignments`의 예정 시간과 시급 스냅샷에서 계산한다.
- `rehearsal_entries`: 사용자가 직접 생성하는 날짜, 시작·종료, 시급 스냅샷.
- 실제 지급, 정산, 급여명세서 테이블은 만들지 않는다.

### 감사

- `audit_log`: 관리자 권한, 배정, 확정, 시간, 교대, 계정 복구·완전 삭제의 변경 전후와 행위자.
- 출퇴근 원본은 자체적으로 append-only이며 별도 수정 로그가 존재하지 않는다.

## 7. 상태 모델

### 스케줄

```mermaid
stateDiagram-v2
  [*] --> OPEN
  OPEN --> CLOSED: 마감일 23:59:59 KST
  CLOSED --> OPEN: 관리자 재오픈
  CLOSED --> PREPARING: 예식·배정 편집
  PREPARING --> CONFIRMED: 경고 확인 후 확정
  CONFIRMED --> CONFIRMED: 관리자 변경 및 재공지
  OPEN --> CANCELLED
  CLOSED --> CANCELLED
  PREPARING --> CANCELLED
  CONFIRMED --> CANCELLED
```

확정 후 변경은 상태를 되돌리지 않고 revision과 감사 로그를 증가시킨다.

### 변경 요청

`PENDING → APPROVED | REJECTED | CANCELLED`

- 상대방의 읽음 또는 동의는 승인 전제조건이 아니다.
- 승인 트랜잭션에서 현재 배정과 포지션 가능 조건을 다시 검사한다.

### 출결

출결은 수정 가능한 단일 상태값이 아니라 사건의 합성 결과다.

- `UNRECORDED`: 출근 원본 없음.
- `ON_TIME`: 예정 시각 이내 출근.
- `LATE`: 예정 시각 이후 출근.
- `ABSENT`: 팀장 또는 관리자의 결근 확인.
- `CHECKED_OUT`: 퇴근 원본 존재.
- `MISSING_CHECK_OUT`: 예정 퇴근 이후 퇴근 원본 없음.

## 8. 핵심 트랜잭션

### 스케줄 확정

1. 관리자 권한과 스케줄 상태를 확인한다.
2. 예식, 예정 시간, 필요 인원, 배정의 구조적 유효성을 검사한다.
3. 배정별 성별·가능 포지션을 검사한다.
4. 부족 인원을 계산하되 오류가 아닌 경고로 반환한다.
5. 관리자가 경고를 확인하면 시급 스냅샷과 revision을 저장하고 확정한다.
6. 전체 배정자에게 알림 outbox를 생성한다.

### 교대 승인

1. 요청과 기존 배정을 잠근다.
2. 교대자가 기존 정식 포지션을 모두 수행 가능한지 다시 검사한다.
3. 기존 배정의 담당자를 교체하고 시급 스냅샷을 갱신한다.
4. 요청을 승인하고 감사 로그를 남긴다.
5. 영향받는 사용자에게 알림을 생성한다.

### 출퇴근 인증

1. 서버에서 현재 시각과 사용자의 확정 배정을 조회한다.
2. 허용 시간 창을 검사한다.
3. GPS면 거리와 보고 정확도를, QR이면 주차 서명을 검사한다.
4. 서버 `now()`로 원본 사건을 INSERT한다.
5. 동일 사용자·스케줄·사건 유형의 중복 INSERT를 고유 제약으로 차단한다.
6. 클라이언트 재시도에는 멱등성 키로 같은 결과를 반환한다.

## 9. 급여 계산

금액은 원 단위 정수로 저장하거나 반환하고 중간 계산은 분 단위로 한다.

```text
scheduled_minutes = max(0, scheduled_end - scheduled_start)
regular_minutes = min(scheduled_minutes, 540)
overtime_minutes = max(0, scheduled_minutes - 540)

estimated =
  hourly_rate_snapshot * regular_minutes / 60
  + hourly_rate_snapshot * 1.5 * overtime_minutes / 60
```

- 반올림 정책은 최종 원 단위 반올림으로 통일한다.
- 결근 처리된 일반 근무는 0원으로 표시한다.
- 실제 출퇴근 시각은 예상 급여 공식에 사용하지 않는다.
- 리허설은 자기기록 시간에 같은 공식을 적용한다.

## 10. 권한 매트릭스

| 리소스 | 본인 근무자 | 당일 팀장 | 관리자 | 슈퍼 관리자 |
| --- | --- | --- | --- | --- |
| 본인 프로필 | 읽기·일부 수정 | 동일 | 전체 관리 | 전체 관리 |
| 가능 포지션·시급 | 읽기 | 본인 읽기 | 관리 | 관리 |
| 모집 신청 | 본인 관리 | 본인 관리 | 전체 조회·대리 배정 | 동일 |
| 확정 전체 배정표 | 이름·포지션 조회 | 동일 | 관리 | 관리 |
| 다른 사람 개인정보 | 불가 | 불가 | 조회 | 조회 |
| 출퇴근 원본 생성 | 본인만 | 본인만 | 본인만 | 본인만 |
| 출퇴근 원본 수정·삭제 | 불가 | 불가 | 불가 | 불가 |
| 타인 출결 확인 | 불가 | 해당 날짜만 | 가능 | 가능 |
| 관리자 임명 | 불가 | 불가 | 불가 | 가능 |
| 리허설 | 본인 CRUD | 본인 CRUD | 전체 조회 | 전체 조회 |
| 계정 완전 삭제 실행 | 불가 | 불가 | 관리자 전용 command | 관리자 전용 command |

RLS 테스트는 이 매트릭스를 그대로 테스트 케이스로 사용한다.

## 11. 알림 아키텍처

- 도메인 트랜잭션은 `notifications`와 `notification_outbox`를 같은 트랜잭션에 기록한다.
- 즉시 알림은 서버 작업 완료 후 발송을 시도한다.
- 시간 기반 알림은 Cron이 매분 due outbox를 선택한다.
- `event_type + aggregate_id + recipient_id + revision`을 멱등성 키로 사용한다.
- 실패한 구독 endpoint는 오류 횟수를 누적하고 영구 만료 응답이면 비활성화한다.
- 앱 내 알림은 푸시 실패와 무관하게 남는다.

## 12. 개인정보와 보안

- 모든 통신은 HTTPS를 사용한다.
- Supabase service role, VAPID private key, QR 서명 비밀은 서버 환경변수로만 관리한다.
- 위치와 출퇴근 원본은 관리자·당일 팀장에게 필요한 최소 범위로 제공한다.
- 탈퇴 복구 정보는 활성 프로필과 별도 테이블·키로 분리한다.
- 완전 삭제 요청은 앱에서 접수하지 않는다. 관리자 전용 서버 command가 대상 이름 재입력을 검증한 뒤 복구 정보를 파기하고 과거 기록을 익명화한다.
- 관리자 중요 작업은 `audit_log`에 행위자와 변경 전후를 기록한다.
- Google OAuth 성공만으로 활성 권한을 주지 않고 관리자 승인 상태를 확인한다.
- GPS는 단독 부정행위 방지 수단으로 간주하지 않으며 실패 시 현장 QR을 사용한다.

## 13. 신뢰성과 관측성

- 모든 예약 작업은 마지막 성공 시각, 처리 수, 오류를 기록한다.
- 마감·알림 작업은 재실행해도 결과가 중복되지 않아야 한다.
- 스케줄 확정과 교대 승인은 데이터베이스 트랜잭션으로 처리한다.
- 사용자에게 표시하는 오류에는 재시도 가능 여부와 관리자 문의 경로를 포함한다.
- 운영 전 최소 한 대의 Android와 한 대의 iPhone 홈 화면 PWA에서 푸시·GPS·QR을 검증한다.

## 14. 배포 환경

- `local`: Supabase CLI와 로컬 Next.js.
- `preview`: 가상 사용자 데이터만 사용하며 프로덕션 OAuth·푸시 키와 분리.
- `production`: Vercel Pro와 Supabase Pro를 기본 운영 대상으로 한다.

필수 환경변수 범주:

- Supabase URL과 publishable key
- 서버 전용 service role key
- Google OAuth 설정
- VAPID public/private key와 subject
- 최초 슈퍼 관리자 Google 이메일
- QR 서명 비밀
- 애플리케이션 기준 URL

## 15. 테스트 전략

### 단위 테스트

- 시간 추천과 예식 자동 생성
- 포지션 성별·가능 여부
- 필요 인원 계산과 교육생 제외
- 급여 분 단위 계산과 9시간 경계
- QR 주차 계산과 서명 검증

### 통합 테스트

- RLS 권한 매트릭스
- 모집 마감과 재오픈
- 미달 경고 후 확정
- 특정·공개 교대 승인
- 출퇴근 append-only 제약
- 탈퇴와 재가입 이력 연결
- 관리자 완전 삭제 권한·이름 확인·감사 기록

### E2E

- 가입 대기부터 관리자 승인
- 한 달 일정 일괄 오픈과 다중 신청
- 예식 생성, 배정, 확정, 전체 배정표
- GPS 실패 후 QR 출근
- 지각과 결근 처리
- 취소·교대 요청
- 월별 예상 급여와 리허설 CRUD

## 16. 의도적으로 미룬 결정

- 실제 앱 아이콘·브랜드 자산 제작과 [현재 디자인 시스템](DESIGN.md)을 벗어나는 후속 브랜드 리디자인.
- 자동 배정·사고 이력의 데이터 모델: MVP 이후 별도 PRD와 ADR.
- 실제 급여·노무 정산: 별도 제품 범위.
