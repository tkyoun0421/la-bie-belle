# 도메인 결정 대장

인터뷰(기획·설계)에서 승인된 도메인 결정을 한 곳에서 읽기 위한 대장이다. **이 문서는 정본이 아니다** — 각 항목의 정본은 링크가 소유하며, 이 문서와 정본이 어긋나면 정본이 이긴다. 승인 게이트에서 결정이 확정될 때마다 조정자가 한 항목씩 추가한다(WORKFLOW 공통 인터뷰 계약).

표기: 각 항목은 아래 형태를 따른다. **볼드 문장만 따라 읽으면 전체 결정을 훑을 수 있다.** 항목 추가는 `/decision` 스킬로 한다 — 양식과 절차는 [.claude/skills/decision/](../../.claude/skills/decision/SKILL.md)이 소유한다.

> **결정의 요지 한 문장.** 조건·예외·세부. — 정본 링크 (승인일)

## IDENTITY

- **권한의 정본은 권한 매트릭스다.** 계정 주체는 anon·pending·rejected·active·dormant·departed·admin·super admin 8종이다. — [ARCHITECTURE 10장](../standards/ARCHITECTURE.md) (2026-08-07 정합화)
- **가입은 관리자 승인제다.** 승인 대기·거절 상태는 가능한 행동과 문의 경로만 안내한다. — [WORKER-FLOWS](design/WORKER-FLOWS.md) · [ADMIN-FLOWS](design/ADMIN-FLOWS.md)
- **3개월 비활동이면 휴면, 1년이면 자동 탈퇴 예정이다.** 재활성화는 본인이 관리자 승인 없이 즉시 하며, 성공 시 새 기준이 시작된다. — [WORKER-FLOWS 휴면 절](design/WORKER-FLOWS.md) · [P1-T06 RADIO](../execution/radio/P1-T06-radio.md)
- **관리자 휴면 처리는 사유 입력이 없다.** 활성 신청·진행 중·미래 배정이 있으면 차단된다. — [ADMIN-FLOWS 팀원 관리 절](design/ADMIN-FLOWS.md)
- **비활성 주체도 자기 프로필은 읽을 수 있다.** 휴면·탈퇴 안내 화면이 이 권한에 의존한다. — [P1-T07 handoff](../execution/runs/P1-T07/handoff.md) (2026-08-07 검증에서 확인)
- **시급은 본인이 읽고 수정할 수 있으며 관리자가 관리한다.** — [ARCHITECTURE 권한 매트릭스](../standards/ARCHITECTURE.md) (2026-08-07 정합화)

## SCHEDULING

### 스케줄 생명주기 (P2-T01)

- **스케줄 상태는 5종이다 — OPEN·CLOSED·PREPARING·CONFIRMED·CANCELLED.** 전이 표의 정본은 P2-T01 RADIO Data model이고, 표 밖 전이는 DB가 최종 거부한다. — [P2-T01 RADIO](../execution/radio/P2-T01-radio.md) (2026-08-07 설계)
- **같은 근무일의 활성 모집은 하나다.** 활성 모집은 CANCELLED를 제외한 전 상태이며, 추가 인원은 재오픈으로 해결한다. — [phase P2-T01 절](../execution/phases/02-recruitment.md) (2026-08-07 기획)
- **과거 근무일·마감일은 만들 수 없다(당일 허용).** 마감일은 근무일과 같거나 이전이고, 기준은 생성 시점의 KST 오늘이다. 과거 금지는 **생성 시점 규칙**이며, 연장·재오픈 UPDATE 경로의 유효성은 P2-T04 설계가 다룬다. — [phase P2-T01 절](../execution/phases/02-recruitment.md) (2026-08-07 기획) · [P2-T01 handoff 미결](../execution/runs/P2-T01/handoff.md)
- **마감 시각은 저장하지 않는다.** 마감일 + 23:59:59 KST 파생이며, 실행은 P2-T04 소유다. — [P2-T01 RADIO](../execution/radio/P2-T01-radio.md) (2026-08-07 설계)
- **취소 기능은 P3로 이월했다.** CANCELLED 상태 값은 스키마에 있지만 취소 전이·기능 구현은 없다. CONFIRMED→CANCELLED(확정 후 취소) 허용 여부는 P3 기획 미결이다. — [phase P2-T01 절](../execution/phases/02-recruitment.md) (2026-08-07 기획)

### 신청 (P2-T01·T03)

- **신청은 근무자×스케줄 단일 행이다.** applied↔withdrawn을 오가며 행 삭제 없이 이력이 남는다. 재오픈 시 기존 applied 신청은 유지된다. — [phase P2-T01 절](../execution/phases/02-recruitment.md) (2026-08-07 기획)
- **신청·철회 저장은 스케줄 상태와 마감 시각을 둘 다 검증한다.** 자동 마감 실행이 늦어도 마감 후 신청·철회는 거부된다. — [phase P2-T03 절](../execution/phases/02-recruitment.md) (2026-08-07 기획)
- **다중 신청은 부분 성공 없이 원자 처리된다.** 다른 사용자의 신청 상태는 노출되지 않는다. — [phase P2-T03 절](../execution/phases/02-recruitment.md)
- **마지막 batch 되돌리기(Undo)를 제공한다.** 직전 batch의 반대 방향 batch 재전송이며 서버에 별도 상태를 두지 않는다. 마감 후 Undo는 일반 규칙으로 거부된다. — [phase P2-T03 절](../execution/phases/02-recruitment.md) (2026-08-07 기획)
- **관리자 역할 사용자도 근무자와 같은 신청 흐름을 사용한다.** — [phase P2-T03 절](../execution/phases/02-recruitment.md)
- **신청 batch는 목표 상태 의미론이고 멱등이다.** 이미 목표 상태인 항목은 무변경 통과하고 실제 전이만 감사에 남는다. 같은 batch 재실행은 추가 효과가 없다. — [P2-T03 RADIO](../execution/radio/P2-T03-radio.md) (2026-08-07 설계)
- **되돌리기는 다음 변경 전까지 유지된다.** 스낵바가 사라져도 하단에 남고, 새 로컬 변경 시작·다음 저장 성공·화면 이탈 세 경우에 사라진다. — [P2-T03 RADIO](../execution/radio/P2-T03-radio.md) (2026-08-07 설계)

### 관리자 일괄 오픈 (P2-T02)

- **여러 근무일 + 공통 마감일을 한 번에 생성한다.** 월 경계 제약이 없다. — [phase P2-T02 절](../execution/phases/02-recruitment.md) (2026-08-07 기획)
- **충돌 날짜는 선택 단계에서 막고, 새어 들어오면 서버가 전체 취소한다.** 이미 활성 모집이 있는 날짜에는 생성할 수 없고, 달력에서 그런 날짜와 과거 날짜는 선택 자체가 막힌다(disabled). 화면이 못 막은 충돌은 서버가 전체 취소하고 충돌 날짜를 안내한다(부분 생성 없음). — [ADMIN-FLOWS 모집 절](design/ADMIN-FLOWS.md) · [P2-T02 RADIO](../execution/radio/P2-T02-radio.md) (2026-08-07 설계)
- **충돌 날짜 목록은 DB 함수의 반환값(데이터)으로 전달한다.** 예외 메시지 파싱은 없다. — [P2-T02 RADIO](../execution/radio/P2-T02-radio.md) (2026-08-07 설계)

### 감사 기록 (P2-T02)

- **감사 기록 단위는 사건이 일어난 스케줄당 1행이다.** SCHEDULING 감사는 append-only 테이블이며, 일괄 실행이어도 스케줄마다 남기고 배치 소속은 detail로 식별한다. 이 단위가 도메인 감사 기록의 본보기다. — [P2-T02 RADIO Data model](../execution/radio/P2-T02-radio.md) (2026-08-07 설계)

### 마감·연장·재오픈 (P2-T04)

- **연장·재오픈의 새 마감일은 KST 오늘 이상·근무일 이하만 허용된다.** 근무일이 지난 스케줄은 연장·재오픈할 수 없다. 생성 시점 과거 금지 규칙의 UPDATE 경로 대칭이다. — [phase P2-T04 절](../execution/phases/02-recruitment.md) (2026-08-07 기획)
- **수동 복구 명령은 운영자용 스크립트다.** 관리자 화면에 두지 않으며, Cron이 놓친 마감 처리를 운영자가 재실행한다. — [phase P2-T04 절](../execution/phases/02-recruitment.md) (2026-08-07 기획)
- **마감 후 신청 변경은 P2에서는 재오픈으로 해결한다.** 요청 기반 취소·교대 흐름은 P4 소유이며, 마감 후~확정 전 구간까지 확장할지는 P4 기획 미결이다. — [phase P2-T04 절](../execution/phases/02-recruitment.md) · [phase P4-T04 절](../execution/phases/04-changes-and-notifications.md) (2026-08-07 기획)
- **자동 마감은 상태 기반 선정이라 멱등이다.** 대상은 OPEN이면서 마감일이 KST 어제 이전인 스케줄뿐이라(마감일 당일은 열려 있음) 재실행해도 상태·감사가 중복되지 않고, 수동 복구는 같은 함수를 재실행한다. — [P2-T04 RADIO](../execution/radio/P2-T04-radio.md) (2026-08-07 설계)
- **연장·재오픈은 관리자 모집 달력에서 한다.** 활성 모집 날짜를 탭하면 관리 시트가 열리고 OPEN이면 마감일 연장, CLOSED면 재오픈을 제공한다. — [P2-T04 RADIO](../execution/radio/P2-T04-radio.md) (2026-08-07 설계)
- **시스템 실행 감사는 행위자 없음(actor null)으로 표기한다.** 자동 마감 함수는 앱 주체에 노출하지 않으며 Cron·운영자 명령만 호출한다. — [P2-T04 RADIO](../execution/radio/P2-T04-radio.md) (2026-08-07 설계)

### 모집 운영 화면 (P2-T05)

- **관리자 신청 현황은 현재 신청자만 보여준다.** 목록은 applied 상태만 담고 철회자는 화면에 두지 않는다. 이력은 applications 행과 감사 기록이 보존하며, 철회 이력 화면이 필요해지면 별도 기획으로 연다. — [phase P2-T05 절](../execution/phases/02-recruitment.md) (2026-08-07 기획)
- **신청자 목록에는 이름만 표시한다.** 개인정보 최소화이며, 가능 포지션 등 배정 판단 정보는 P3 배정 화면 소유다. 이름 외 개인정보 비노출은 P2-T05 인수 조건으로 검증된다. — [phase P2-T05 절](../execution/phases/02-recruitment.md) (2026-08-07 기획)
- **홈의 「마감 임박 근무 신청」 카드는 P2-T05 범위다.** 워커 플로의 홈 구성과 실제 홈을 정합시키며 달력·조회와 같은 데이터를 재사용한다. 노출 기준(마감 임박 정의)은 설계 미결이다. — [phase P2-T05 절](../execution/phases/02-recruitment.md) · [WORKER-FLOWS 앱 셸과 홈 절](design/WORKER-FLOWS.md) (2026-08-07 기획)

## ATTENDANCE · NOTIFICATIONS · PAY

- **아직 인터뷰 결정 없음.** P4 알림의 오늘/이번 주 경계는 로컬 시간대 계산 후보로 기록돼 있다(설계 시점 결정).
