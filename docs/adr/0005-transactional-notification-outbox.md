# ADR-0005: 앱 내 알림과 푸시에 transactional outbox 사용

- 상태: Accepted
- 날짜: 2026-07-23

## Context

확정, 변경, 교대 승인과 데이터 변경은 성공했지만 푸시 발송이 실패할 수 있다. 예약된 출퇴근 누락 알림도 중복 없이 재시도해야 한다.

## Decision

- 도메인 변경과 같은 트랜잭션에서 `notifications`와 `notification_outbox`를 기록한다.
- 푸시는 outbox 소비자가 비동기로 발송한다.
- `event_type + aggregate_id + recipient_id + revision`을 멱등성 키로 사용한다.
- 발송 상태, 시도 횟수, 마지막 오류와 다음 시도 시각을 저장한다.
- 영구 만료된 push subscription은 비활성화한다.
- 앱 내 알림은 푸시 발송 성공 여부와 독립적으로 유지한다.
- 예약 알림은 Supabase Cron이 due outbox 생성·발송 작업을 실행한다.

## Consequences

- 도메인 변경과 알림 유실 사이의 간극을 줄인다.
- 중복 발송과 재시도 정책을 테스트할 수 있다.
- 즉시 `sendPush()`를 호출하는 것보다 테이블과 worker 로직이 추가된다.
- 초기 규모에서도 운영 장애를 확인할 최소한의 발송 로그가 생긴다.
