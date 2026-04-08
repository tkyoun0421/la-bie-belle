# Build Plan: 웨딩홀 근무 운영 PWA

Based on: [../designs/wedding-hall-ops-pwa.md](C:\code\la-bie-belle\docs\designs\wedding-hall-ops-pwa.md)  
Status: DRAFT  
Date: 2026-04-08

## Goal
첫 버전에서 팀장과 팀원이 실제로 쓸 수 있는 운영 PWA를 만든다.

핵심 가치:
- 팀장: 공고 생성, 신청 관리, 포지션 배정, 취소 대응, 대타 승인
- 팀원: 신청, 취소, 수동 위치 체크인, 예상 급여 확인
- 시스템: 카톡/엑셀/전화로 하던 흐름을 구조화된 상태와 웹 푸시로 대체

## Locked Decisions
- 배포 형태는 비공개 PWA
- 알림 채널은 웹 푸시만 사용
- 체크인은 수동 위치 인증 체크인만 사용
- 체크아웃은 받지 않음
- 팀원은 홈 화면 설치와 웹 푸시 구독 완료 전까지 신청/취소/체크인 기능을 사용할 수 없음
- 역할은 `어드민 / 팀장 / 팀원`
- 프레임워크는 Next.js
- 로그인 인증은 Google Auth
- 누구나 Google 로그인 가능하지만, 첫 로그인 후 어드민 승인을 받아야 팀 기능 접근 가능
- 첫 로그인 승인 완료 시 어드민이 사용자를 `라비에벨 예도팀`에 바로 연결
- 첫 버전 운영 대상은 단일 팀 `라비에벨 예도팀`
- 어드민 콘솔과 실제 운영/근무 앱은 라우트와 내비게이션을 분리
- 체크인 반경 기본값은 행사장 기준 150m
- 행사 시간 모델은 `첫 식 시작 시각 / 막식 종료 시각`
- 행사 템플릿은 `예식 시간 라벨 + 첫 식 시작/막식 종료 + 기본 포지션 슬롯` 기준으로 저장
- 교육 슬롯은 템플릿 기본값이 아니라 행사 생성 시 필요할 때만 추가
- 행사 생성은 템플릿 선택 후 수정 방식
- 포지션 가능 여부는 팀원별 프로필로 관리하고 상태는 `qualified | training`
- 행사 포지션 슬롯은 정규 인원과 교육 인원을 분리해 저장
- 취소 알림은 같은 포지션 가능 인원에게만 발송
- 대타 모집은 자동 마감 시간을 두지 않고 팀장이 수동 종료
- 대타는 선착순 신청 후 팀장이 최종 승인
- 예상 급여는 `첫 식 시작 - 2시간`부터 `막식 종료 + 2시간`
- 9시간 초과분은 1.5배
- 팀장은 드문 예외 케이스만 수동 수정

## Boring Defaults
코드가 아직 없으므로 첫 구현은 boring default로 간다.

- 프론트엔드: Next.js App Router 기반 PWA
- 백엔드: BaaS 계열
- 인증: Google Auth
- 데이터: 관계형 테이블
- 실시간성: push + 폴링 혼합 허용

권장 기본안:
- Client: Next.js + TypeScript + PWA
- Backend: Supabase
- DB: Postgres
- Auth: Google provider 기반 인증
- Push: service worker + Web Push subscriptions

## App IA
화면 군은 두 개로 나눈다.

### 1. Shared Dashboard + Work Pages
- 대상: 어드민, 팀장, 팀원
- 목적: 모두가 먼저 보는 공통 홈과, 그 다음 역할별 작업 화면
- 특징: 첫 진입은 공통 대시보드로 통일하고, 역할에 따라 강조 카드와 빠른 액션만 다르게 노출
- 예시 라우트:
  - `/app`
  - `/app/events/[eventId]`
  - `/app/replacements`
  - `/app/check-in`
  - `/app/pay`

공통 메인 대시보드 섹션:
- 오늘 예식
- 내 근무 / 내 상태
- 팀 공지
- 빠른 액션

역할별 강조:
- `admin`: 관리 페이지 바로가기, 승인 대기 수
- `manager`: 대타 승인 대기, 체크인 예외, 빈 포지션
- `member`: 오늘 근무, 체크인, 예상 급여, 내 신청 상태

### 2. Admin Console
- 대상: 어드민
- 목적: 승인 대기, 팀 설정, 포지션 자격, 템플릿, 급여 규칙
- 특징: 낮은 빈도지만 권한이 강한 작업, 운영 홈과 분리
- 예시 라우트:
  - `/admin`
  - `/admin/requests`
  - `/admin/team`
  - `/admin/positions`
  - `/admin/templates`
  - `/admin/payroll-rules`
- 기본 홈 섹션:
  - 승인 대기
  - 팀원-포지션 자격
  - 예식 템플릿
  - 급여 규칙

로그인 후 기본 진입:
- `admin` -> `/app`
- `manager` -> `/app`
- `member` -> `/app`

이 선택 이유:
- 첫 버전에 필요한 auth, DB, 간단 API, 배포 속도를 동시에 잡기 쉽다.
- 팀 단위 운영 앱이라 복잡한 마이크로서비스가 전혀 필요 없다.
- Next.js 하나로 라우팅, 서버 액션/API, PWA 셸을 같이 가져갈 수 있다.
- Google 로그인은 팀원 입장에서 가장 설명이 쉽고 진입 장벽이 낮다.

## What Already Exists
- 제품 요구는 [wedding-hall-ops-pwa.md](C:\code\la-bie-belle\docs\designs\wedding-hall-ops-pwa.md) 에 정리되어 있다.
- 현재 프로젝트 루트에는 구현 코드가 없고, 설계 문서만 있다.
- 따라서 이 플랜은 신규 앱 부트스트랩 + 첫 기능 구현 기준이다.

## Not In Scope
- 앱스토어 배포
- 카카오톡/SMS 백업 알림
- 자동 지오펜스 체크인
- 체크아웃 기능
- 포지션 수당, 교통비, 식대, 지각 차감
- 최근 근무량까지 반영한 고급 대타 추천
- 부팀장/캡틴 등 추가 역할
- 멀티팀 운영
- 멀티 행사장 고급 운영 대시보드

## Core Data Model
최소 테이블은 아래로 잡는다.

```text
users
- id
- email
- google_sub
- role: admin | manager | member
- name
- phone
- push_enabled
- onboarding_completed_at nullable
- push_subscribed_at nullable

membership_requests
- id
- user_id
- status: pending | approved | rejected
- requested_at
- reviewed_at nullable
- reviewed_by nullable

teams
- id
- name
- slug

team_memberships
- id
- team_id
- user_id
- role_in_team
- hourly_wage

positions
- id
- team_id
- name

member_positions
- id
- membership_id
- position_id
- status: qualified | training

event_templates
- id
- team_id
- name
- time_label
- first_service_at
- last_service_end_at

events
- id
- team_id
- template_id nullable
- title
- time_label
- event_date
- first_service_at
- last_service_end_at
- status

event_position_slots
- id
- event_id
- position_id
- required_count
- training_count default 0

applications
- id
- event_id
- membership_id
- status: applied | cancelled
- applied_at

assignments
- id
- event_id
- membership_id
- position_id
- assignment_kind: regular | training
- status: assigned | confirmed | cancelled | replacement_pending | replacement_approved

replacement_requests
- id
- assignment_id
- position_id
- status: open | pending_manager_approval | approved | closed
- closed_at nullable
- closed_by nullable

replacement_applications
- id
- replacement_request_id
- membership_id
- applied_at

checkins
- id
- assignment_id
- membership_id
- status: checked_in | exception_requested | exception_approved
- checked_in_at
- lat
- lng
- accuracy_m
- within_radius
- exception_request_reason nullable
- exception_requested_at nullable
- exception_approved_by nullable
- exception_approved_at nullable

payroll_previews
- id
- assignment_id
- membership_id
- base_minutes
- overtime_minutes
- expected_amount
- overridden_amount nullable
- override_reason nullable
- overridden_by nullable

audit_logs
- id
- entity_type
- entity_id
- action_type
- before_json
- after_json
- reason nullable
- actor_user_id
- created_at
```

## Permission Matrix
```text
Action                                  Admin   Manager  Member
---------------------------------------------------------------
팀 기본 설정                            O       -        -
팀장 계정 관리                          O       -        -
신규 로그인 승인/거절                   O       -        -
행사 템플릿 관리                        O       O        -
행사 생성/수정                          -       O        -
포지션 슬롯 설정                        -       O        -
신청하기/취소하기                       -       -        O
포지션 배정/확정                        -       O        -
취소 처리                               -       O        -
대타 승인                               -       O        -
체크인 예외 승인                        -       O        -
급여 규칙 설정                          O       -        -
예상 급여 조회                          O       O        O(본인만)
급여 수동 수정                          O       O        -
전체 데이터 조회                        O       제한적    본인만
```

## Core Flows

### 1. 행사 생성
```text
Manager
  -> 템플릿 선택
  -> 첫 식 / 막식 자동 채움
  -> 필요시 시간 수정
  -> 포지션 슬롯 설정
  -> 모집 오픈
```

### 2. 신청과 배정
```text
Member
  -> 행사 목록 보기
  -> 신청

Manager
  -> 신청자 목록 보기
  -> 포지션별 배정
  -> 확정 알림 발송
```

### 3. 취소와 대타
```text
Assigned Member
  -> 취소 요청 또는 취소

System
  -> 해당 포지션 가능 인원만 필터
  -> 웹 푸시 발송

Candidate Members
  -> 선착순 신청

Manager
  -> 신청자 중 1명 승인
  -> 필요 시 모집 닫기
  -> 대타 확정
```

### 4. 체크인과 급여
```text
Member
  -> 행사 당일 출근하기
  -> 현재 위치 검증
  -> 성공 시 체크인 저장
  -> 실패 시 예외 요청

System
  -> 출근 증빙 또는 예외 요청 기록 저장
  -> 행사 시작 후 30분까지 체크인 없으면 미체크인 경고 표시
  -> 급여는 행사 규칙으로 계산

Manager
  -> 예외 요청 승인 또는 미체크인 확인
  -> 급여는 예외 있을 때만 수동 수정
```

## State Machines

### Event
```text
draft -> recruiting -> staffed -> in_progress -> completed
                      \-> cancelled
```

### Assignment
```text
assigned -> confirmed -> checked_in
    \-> cancelled -> replacement_pending -> replacement_approved
```

### Replacement Request
```text
open -> pending_manager_approval -> approved -> closed
```

## Screen Plan

### Screen 1. 공통 메인 대시보드
- 오늘 예식 요약
- 내 근무 / 내 상태 카드
- 팀 공지
- 역할별 빠른 액션
- 어드민은 관리 페이지 바로가기
- 팀장은 운영 작업 바로가기
- 팀원은 체크인 / 예상 급여 바로가기

### Screen 2. 팀장 행사 생성/배정 화면
- 템플릿 선택
- 첫 식 / 막식 확인 및 수정
- 포지션별 필요 인원 입력
- 포지션별 교육 인원 입력
- 신청자 목록
- 포지션 배정
- 확정 알림 발송

### Screen 3. 팀원 신청/취소/예상 급여 화면
- 내 행사 목록
- 신청 가능 행사
- 신청 / 취소 버튼
- 배정 상태
- 예상 급여 카드

### Screen 3A. 팀원 온보딩 게이트 화면
- 홈 화면 설치 안내
- 웹 푸시 권한 허용 안내
- 현재 완료 상태 표시
- 완료 전 핵심 기능 잠금

### Screen 4. 취소 후 대타 모집/승인 화면
- 취소된 자리 표시
- 정규 자리 / 교육 자리 구분 표시
- 알림 발송 대상 수
- 선착순 지원자 목록
- 모집 닫기 버튼
- 팀장 승인 버튼

### Screen 5. 팀원 체크인 화면
- 오늘 행사
- 출근하기 버튼
- 위치 권한 요청
- 반경 통과 여부
- 체크인 완료 상태
- 체크인 실패 시 예외 요청 버튼

### Screen 6. 어드민 설정 화면
- 승인 대기 사용자 목록
- 승인 / 거절 액션
- `라비에벨 예도팀` 기본 설정
- 팀장 관리
- 포지션 카탈로그
- 행사 템플릿 관리
- 급여 규칙 설정
- 운영 홈과 분리된 별도 어드민 콘솔
- 기본 레이아웃:
  - 상단: 승인 대기 수, 최근 변경 로그, 빠른 액션
  - 본문 1: 승인 대기 테이블
  - 본문 2: 팀원-포지션 자격 매트릭스
  - 본문 3: 예식 템플릿 리스트 + 편집 폼
  - 본문 4: 급여 규칙 카드 + 수정 이력

## Failure Modes
- 아무 Google 계정으로 로그인되지만 팀 소속이 연결되지 않음
  대응: 첫 로그인 후 승인 대기 상태로 보내고, 어드민 승인 전에는 팀 기능 접근 차단
- 어드민 승인 후 기본 팀 연결이 실패함
  대응: 승인 액션에서 멤버십 생성을 함께 처리하고, 실패 시 재시도 액션과 경고 상태를 제공
- 팀원이 홈 화면 설치나 푸시 권한을 안 함
  대응: 온보딩 게이트에서 신청/취소/체크인 진입을 막고, 설치/구독 완료 후에만 핵심 기능 해제
- 실내 GPS 오차로 체크인 실패
  대응: 150m 반경 기준으로 시작하고, GPS 품질이 낮으면 재시도 UX 후 팀장 예외 승인
- 행사 시작 후 30분이 지나도 체크인이 없음
  대응: 팀장 화면에 미체크인 경고 상태를 띄우고, 예외 승인 또는 수동 확인 액션 제공
- 취소 알림이 너무 늦게 감
  대응: 앱 내 대기 상태 반영, 관리자 화면에서 미응답 인원 확인
- 팀장이 대타를 승인 안 해서 상태가 멈춤
  대응: replacement_pending 상태를 별도 강조
- 대타 모집이 너무 오래 열려 불필요한 신청이 계속 들어옴
  대응: 팀장 화면에서 모집 닫기 액션을 제공하고, 닫힌 뒤에는 추가 신청을 막음
- 행사 시간 입력 실수로 급여가 잘못 계산됨
  대응: 행사 저장 전 인정 근무시간과 예상 급여 미리보기
- 교육 중 인원이 일반 슬롯에 잘못 배정됨
  대응: 배정 UI에서 정규 슬롯은 `qualified` 인원만, 교육 슬롯은 `qualified` 또는 `training` 인원만 보이도록 필터
- 체크인 예외 승인이나 급여 수동 수정 사유가 남지 않음
  대응: 예외 승인과 수동 수정 모두 audit_logs에 before/after/reason/actor를 기록

## Test Plan

### Unit
- 인정 근무시간 계산
- 9시간 초과 1.5배 계산
- 포지션 가능 인원 필터
- 정규 슬롯 / 교육 슬롯 인원 필터
- 행사 템플릿 시간 복사
- 행사 템플릿 타입 라벨/시간/슬롯 복사

### Integration
- 행사 생성 -> 신청 -> 배정 -> 확정
- 교육 슬롯 포함 행사 생성 -> 교육 인원 배정
- 취소 -> 대타 알림 -> 선착순 신청 -> 팀장 승인
- 대타 모집 수동 종료 -> 추가 신청 차단
- 체크인 성공 / 실패 / 반경 밖 / 예외 요청
- 행사 시작 후 30분 경과 -> 미체크인 경고 표시
- 급여 수동 수정 이력 저장
- 체크인 예외 승인 / 급여 수동 수정 감사 로그 저장

### E2E
- 팀장 1명, 팀원 2명 시나리오
- 취소 발생 후 대타 승인까지 완료
- 팀원 체크인 후 예상 급여 확인
- 체크인 실패 후 예외 요청 -> 팀장 승인
- 푸시 권한 미허용 시 온보딩 차단
- 홈 화면 미설치 시 온보딩 게이트 유지

## Implementation Phases

### Phase 0. Bootstrap
- Next.js 앱 부트스트랩
- Google Auth
- PWA 기본 셸
- 역할 기반 라우팅
- 기본 DB 스키마
- 승인 대기 화면
- 팀원 온보딩 게이트 화면
- 단일 팀 seed 데이터 (`라비에벨 예도팀`)

### Phase 1. Event + Template
- 행사 템플릿 CRUD
- 행사 라벨 + 예식 타입 라벨 입력
- 행사 생성
- 첫 식 / 막식 입력
- 포지션 슬롯 입력
- 교육 슬롯 입력

### Phase 2. Application + Assignment
- 팀원 신청/취소
- 신청 목록
- 포지션 배정
- 확정 상태

### Phase 3. Replacement
- 취소 처리
- 포지션 가능 인원 필터
- 웹 푸시 발송
- 선착순 신청
- 모집 수동 종료
- 팀장 승인

### Phase 4. Check-in
- 수동 위치 인증 체크인
- 반경 설정 (기본 150m)
- 체크인 실패 -> 예외 요청
- 행사 시작 후 30분 미체크인 경고
- 팀장 예외 승인

### Phase 5. Payroll Preview
- 인정 근무시간 계산
- 예상 급여 계산
- 9시간 초과 로직
- 팀장 수동 수정

## Suggested Build Order
1. Google Auth + role routing + membership request/approval flow
2. 승인된 사용자 기본 팀 연결
3. 팀/포지션/멤버/포지션자격 기본 데이터
4. 행사 템플릿 + 행사 생성
5. 신청/배정
6. 취소/대타 승인
7. 체크인
8. 예상 급여

## Parallelization Strategy
병렬 작업 가능:
- Workstream A: DB schema + auth + roles
- Workstream B: 팀장 행사/배정 UI
- Workstream C: 팀원 신청/체크인 UI

순차 의존:
- 대타 승인 흐름은 신청/배정 모델이 먼저 필요
- 급여 계산은 행사 시간 모델이 먼저 필요

## Open Decisions That May Bite Later
- 어드민 범위를 단일 팀 관리로 제한할지, 다중 팀/다중 행사장으로 열어둘지

## Shipping Slice
정말 첫 배포를 더 잘라야 하면 아래를 최소 배포 단위로 본다.

- 팀장 행사 생성
- 팀원 신청
- 팀장 포지션 배정
- 취소 후 대타 승인
- 팀원 수동 위치 체크인
- 예상 급여 계산

이 여섯 개가 살아 있으면 카톡/엑셀/전화 대체 실험을 시작할 수 있다.
