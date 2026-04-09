# Screen Spec: 웨딩홀 근무 운영 PWA

Build Plan: [./build-plan.md](./build-plan.md)  
Architecture: [./architecture-spec.md](./architecture-spec.md)  
Execution: [./execution-plan.md](./execution-plan.md)  
Design: [../designs/pwa.md](../designs/pwa.md)  
Status: ACTIVE  
Date: 2026-04-09

## Purpose
이 문서는 화면 구조, 핵심 사용자 흐름, 화면별 책임, 실패 시 fallback을 정리한다.  
기술 규칙과 데이터 모델은 [Architecture Spec](./architecture-spec.md)을 따른다.

## App IA

### Shared Dashboard And Work Pages
- 기본 진입점은 `/app`
- 모든 역할은 공통 대시보드에서 시작한다
- 이후 역할에 따라 강조 카드와 빠른 액션만 달라진다

주요 경로:
- `/app`
- `/app/events/[eventId]`
- `/app/replacements`
- `/app/check-in`
- `/app/pay`

### Admin Console
- 운영 설정과 승인 업무는 `/admin`으로 분리한다
- 실제 근무 흐름과 설정 흐름을 섞지 않는다

주요 경로:
- `/admin`
- `/admin/requests`
- `/admin/users`
- `/admin/positions`
- `/admin/templates`
- `/admin/payroll-rules`

## Core Flows

### 1. 행사 생성
1. 팀장이 템플릿을 고른다.
2. 기본 시간과 슬롯을 확인하고 필요하면 수정한다.
3. 모집을 연다.

### 2. 신청과 배정
1. 팀원이 행사 목록을 보고 신청한다.
2. 팀장이 신청 목록을 확인한다.
3. 중복 배정 경고가 있으면 확인 후 배정한다.
4. 확정 알림을 보낸다.

### 3. 취소와 대타
1. 배정된 팀원이 취소를 요청한다.
2. 시스템이 replacement request를 만든다.
3. 가능한 포지션 인원에게만 푸시를 보낸다.
4. 지원자가 들어오면 팀장이 한 명을 승인한다.
5. 새 assignment를 만들고 모집을 닫는다.

### 4. 체크인과 예상 급여
1. 팀원이 행사 당일 체크인을 시도한다.
2. 반경 통과 시 체크인 완료로 기록한다.
3. 실패하면 예외 요청을 남긴다.
4. 예상 급여는 행사 시간과 시급으로 계산해 보여준다.
5. 팀장은 예외 승인이나 급여 override만 처리한다.

## Screen Responsibilities

### Screen 1. 공통 메인 대시보드
- 오늘 일정 요약
- 내 근무 상태
- 공지
- 역할별 빠른 액션

역할별 강조:
- `admin`: 승인 대기, 운영 설정 바로가기
- `manager`: 오늘 행사, 대타 승인 대기, 미체크인 경고
- `member`: 오늘 근무, 체크인, 예상 급여, 신청 상태

### Screen 2. 팀장 행사 생성/배정 화면
- 템플릿 선택
- 시간 수정
- 포지션별 필요 인원 입력
- 신청 목록 조회
- 배정과 확정

### Screen 3. 팀원 신청/취소/예상 급여 화면
- 신청 가능한 행사 목록
- 신청/취소 버튼
- 내 배정 상태
- 예상 급여 카드

### Screen 3A. 온보딩 게이트 화면
- 앱 설치 안내
- 푸시 구독 안내
- 현재 완료 상태 표시
- 완료 전에는 운영 기능 잠금

### Screen 4. 대타 모집/승인 화면
- 취소된 자리 표시
- 정직/교육 자리 구분
- 지원자 목록
- 모집 종료
- 승인

### Screen 5. 체크인 화면
- 오늘 행사 목록
- 체크인 버튼
- 위치 권한 요청
- 반경 통과 여부
- 예외 요청 버튼

### Screen 6. 어드민 설정 화면
- 승인 대기 사용자 목록
- 승인/거절 액션
- 사용자 역할과 자격 관리
- 템플릿 관리
- 급여 규칙 관리
- 최근 운영 로그

## Failure Modes
- 승인 전 사용자
  - 승인 대기 화면으로 보낸다
  - 운영 기능은 열지 않는다
- 승인 성공 후 역할/접근 갱신 실패
  - 승인 액션과 상태 변경을 한 트랜잭션으로 처리한다
  - 실패 시 재시도 가능 상태를 남긴다
- 설치 또는 푸시 구독 미완료
  - 온보딩 게이트에서 신청/취소/체크인 진입을 막는다
- 푸시 전달 실패
  - 요청 상태는 그대로 남기고, 관리 화면에서 미응답 상황을 확인한다
- GPS 저정확도 또는 반경 밖 체크인
  - 즉시 예외 요청으로 전환한다
- 행사 시작 후 30분이 지나도 체크인 없음
  - 관리 화면에 미체크인 경고를 띄운다
- 대타 모집이 오래 열려 있음
  - 팀장이 직접 모집 종료할 수 있다
- 대타 승인 중 상태 경쟁 발생
  - 승인, assignment 생성, 요청 종료를 한 서버 트랜잭션으로 묶는다
- 급여 계산이 잘못될 수 있는 입력 오류
  - 행사 시간과 예상 급여를 같은 화면에서 같이 확인하게 한다
- 수동 예외 승인 또는 급여 override 사유 누락
  - `audit_logs`에 `before / after / reason / actor`를 남긴다
