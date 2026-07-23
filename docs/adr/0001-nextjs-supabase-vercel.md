# ADR-0001: Next.js, Supabase, Vercel 기반 운영

- 상태: Accepted
- 날짜: 2026-07-23

## Context

MVP는 모바일 PWA, Google OAuth, PostgreSQL 권한, Web Push, 예약 알림, GPS·QR 출퇴근을 제공해야 한다. 초기 운영 규모는 관리자 약 3명과 월 8개 스케줄이며, 별도 백엔드 운영 인력을 전제하지 않는다.

## Decision

- Next.js App Router와 TypeScript로 PWA와 서버 경계를 함께 구현한다.
- Supabase Auth의 Google OAuth와 Supabase PostgreSQL을 사용한다.
- Supabase 프로젝트는 Seoul 리전을 사용한다.
- Supabase Cron과 Edge Function으로 시간 기반 작업을 처리한다.
- Next.js 애플리케이션은 Vercel에 배포한다.
- 정식 사업장 운영은 Supabase Pro와 Vercel Pro를 기준으로 한다.

## Consequences

- 하나의 TypeScript 중심 코드베이스로 클라이언트와 서버를 관리할 수 있다.
- RLS, Auth, Cron을 직접 구축하지 않아도 된다.
- Vercel과 Supabase에 대한 운영 의존성이 생긴다.
- 로컬 개발을 위해 Supabase CLI와 마이그레이션 관리가 필수다.
- 핵심 도메인 로직은 공급자 전용 기능에 묻지 않고 SQL 함수와 TypeScript 모듈로 분리한다.
