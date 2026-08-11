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
- **홈 카드의 마감 임박 기준은 KST 오늘 포함 3일이다.** 마감일이 D+0~D+2인 OPEN 모집이 대상이고 가장 임박한 1건만 카드에 올린다. 기획이 미결로 남긴 노출 기준의 확정이다. — [P2-T05 RADIO](../execution/radio/P2-T05-radio.md) (2026-08-08 설계)
- **홈 카드는 본인 신청 여부와 무관하게 노출한다.** 마감이 시간 기준이라 신청자에게도 마감일이 직접 철회할 수 있는 마지막 시점이다. 미신청이면 신청 유도, applied면 마감 전까지 변경 가능 안내를 보여준다. — [P2-T05 RADIO](../execution/radio/P2-T05-radio.md) (2026-08-08 설계)
- **날짜별 신청 수는 관리자 달력 셀 배지와 관리 시트 양쪽에 표시한다.** 신청자 이름 목록은 시트 안에만 두고, 시트를 연 시점에만 조회한다. 진입은 P2-T04 관리 시트의 하위 호환 확장이다. — [P2-T05 RADIO](../execution/radio/P2-T05-radio.md) (2026-08-08 설계)
- **오늘·임박 판정은 서버가 KST로 계산한다.** 브라우저 시간대는 표시에만 관여하고 판정에 관여하지 않는다. 기존 MUST 규칙 DEV-TIME-03·04의 기본 적용을 확인한 결정이다. — [P2-T05 RADIO](../execution/radio/P2-T05-radio.md) · [DEVELOPMENT 시간 규칙](../standards/DEVELOPMENT.md) (2026-08-08 설계)

### 예식과 시간 추천 (P3-T01)

- **규칙표 밖 첫 예식 시각은 버림 방식으로 출근을 추천한다.** 첫 예식 시각 이하 규칙 중 가장 늦은 것의 간격을 적용하고, 그보다 이르면 가장 이른 규칙의 간격을 쓴다(예: 규칙 10:00→08:20·11:00→09:10일 때 12:00→10:10). 규칙표 최소 CRUD는 P3-T01 범위다. — [phase P3-T01 절](../execution/phases/03-assignment-and-confirmation.md) (2026-08-08 기획)
- **예식 시각 수정으로 순서가 바뀌면 시각순으로 재정렬한다.** 같은 시각 중복만 거부하고 순서 역전은 오류가 아니다. — [phase P3-T01 절](../execution/phases/03-assignment-and-confirmation.md) (2026-08-08 기획)
- **예식 입력은 모집 OPEN 중에도 허용하며 상한은 확정 전까지다.** 확정 후 변경은 P3-T06 revision 소유다. ADR-0003의 종전 "마감 이후" 서술은 이 결정으로 개정됐다. — [phase P3-T01 절](../execution/phases/03-assignment-and-confirmation.md) · [ADR-0003](../standards/adr/0003-schedule-lifecycle-and-snapshots.md) (2026-08-08 기획)
- **퇴근 추천이 자정을 넘으면 23:59로 캡하고 안내한다.** 심야 예식이 실제로 필요해지면 별도 기획으로 연다. 예식·예정 출퇴근 데이터는 확정 배정표(P3-T07) 전까지 관리자 전용이다. — [P3-T01 RADIO](../execution/radio/P3-T01-radio.md) (2026-08-08 설계)

### 포지션과 필요 인원 (P3-T02)

- **스케줄 필요 인원은 준비 화면 첫 진입 시점의 기본값 복사다.** 특이사항은 스케줄 표에서 수정하고, 전역 기본 인원수 변경은 이미 복사된 스케줄에 전파하지 않는다(포지션 구조만 강제, 인원값은 스냅샷). 필요 인원 0명으로 그날 미운영을 표현한다. — [PRD 7장](PRD.md) · [phase P3-T02 절](../execution/phases/03-assignment-and-confirmation.md) (2026-08-09 기획)
- **새 포지션은 확정 전 스케줄에 강제 반영되고 확정 스케줄은 알림 후 수동 추가다.** 확정 전 스케줄의 필요 인원 표에는 기본 인원수로 자동 추가되며, 확정 스케줄은 자동으로 바뀌지 않되 관리자가 추가 여부를 안내받는다. 확정 후 변경의 revision 연동은 P3-T06 소유다. — [PRD 7장](PRD.md) · [phase P3-T02 절](../execution/phases/03-assignment-and-confirmation.md) (2026-08-09 기획)
- **기본 포지션은 모두가 들어갈 수 있는 포지션이다.** 새 포지션을 기본으로 지정하면 이미 승인된 근무자 전원에게 즉시 적용되고, 해제하면 자동 가능이 즉시 회수된다(기본 지정 전 개인별 부여분은 유지). — [PRD 4장](PRD.md) (2026-08-09 기획)
- **스케줄 필요 인원에 쓰인 포지션도 삭제할 수 없다.** 배정·개인별 가능 포지션과 같은 판정이며 삭제 시도는 비활성화 안내로 막는다. 포지션 관리와 필요 인원 수정은 관리자 전용이다(당일 팀장 아님). — [PRD 4장](PRD.md) · [phase P3-T02 절](../execution/phases/03-assignment-and-confirmation.md) (2026-08-09 기획)

### 배정 후보와 자격 (P3-T03)

- **자격은 배정을 만드는 순간에만 검사한다.** 배정 뒤 개인별 가능 포지션을 회수하거나 포지션의 성별 조건을 바꾸어도 이미 만들어진 배정은 그대로 두고 따로 표시하지 않는다. 확정 시점에 다시 검사할지는 P3-T06 설계 미결이다. — [PRD 7장](PRD.md) · [phase P3-T03 절](../execution/phases/03-assignment-and-confirmation.md) (2026-08-10 기획)
- **필요 인원은 상한이 아니다.** 필요 인원을 넘겨 배정할 수 있고 0명인 포지션에도 배정할 수 있으며, 초과는 경고 없이 `필요 N / 배정 M` 숫자로만 드러낸다. 미달만 경고 대상이라는 INV-STAFF-01과 짝을 이룬다. — [PRD 7장](PRD.md) (2026-08-10 기획)
- **후보 목록은 신청자와 미신청자를 두 묶음으로 나눈다.** 조건을 통과하지 못한 근무자는 접어두고 펼치면 성별 조건 불일치·가능 포지션 없음 중 해당 이유를 보여주며, 이미 다른 포지션에 배정된 근무자는 제자리에 두고 배지로만 표시한다. — [PRD 7장](PRD.md) · [phase P3-T03 절](../execution/phases/03-assignment-and-confirmation.md) (2026-08-10 기획)
- **확정 전 스케줄에는 배정할 수 있다.** `OPEN`·`CLOSED`·`PREPARING` 세 상태가 모두 해당하고 `CONFIRMED`·`CANCELLED`만 거부하며, 이는 P3-T02 필요 인원 복사가 쓰는 판정과 같다. 확정된 스케줄의 배정 변경은 알림·revision과 함께 P3-T06 이후가 가진다. — [PRD 7장](PRD.md) · [phase P3-T03 절](../execution/phases/03-assignment-and-confirmation.md) (2026-08-10 기획)
- **배정 추가와 제거는 확정 전부터 감사 기록에 남긴다.** 필요 인원 변경이 이미 확정 전 감사를 남기고 있어 같은 화면의 두 동작을 같은 규칙으로 맞췄다. — [PRD 7장](PRD.md) (2026-08-10 기획)

### 복수 포지션 (P3-T04)

- **한 사람이 겸할 수 있는 포지션 개수에 상한이 없다.** 메인+스캔 둘이 전형이지만 셋 이상도 저장되고 경고도 띄우지 않는다. 필요 인원이 상한이 아니라는 P3-T03 결정과 결이 같다. 겸직자의 급여를 한 번 세는지 두 번 세는지는 P6 미결이고, 출퇴근 기록이 하나인지 둘인지는 P5 미결이다. — [ADMIN-FLOWS 배정 절](design/ADMIN-FLOWS.md) · [phase P3-T04 절](../execution/phases/03-assignment-and-confirmation.md) (2026-08-11 기획)
- **겸직으로 포지션 합계와 실인원이 달라질 때만 실인원을 보여준다.** 필요 인원 표 위에 `오는 사람 N명 · 포지션 합계 M`을 한 줄로 띄우고, 두 값이 같은 날은 줄을 아예 띄우지 않는다. 포지션 합계는 실인원보다 클 수는 있어도 작을 수는 없다. — [ADMIN-FLOWS 배정 절](design/ADMIN-FLOWS.md) · [phase P3-T04 절](../execution/phases/03-assignment-and-confirmation.md) (2026-08-11 기획)
- **배정 흐름은 `포지션 선택 → 근무자 선택` 하나로 둔다.** 근무자 한 명을 눌러 그 사람의 포지션을 한자리에서 붙였다 뗐다 하는 화면은 만들지 않는다. 겸직자를 스케줄에서 통째로 빼려면 그 사람이 든 포지션 시트를 각각 열어 해제한다. — [ADMIN-FLOWS 배정 절](design/ADMIN-FLOWS.md) · [phase P3-T04 절](../execution/phases/03-assignment-and-confirmation.md) (2026-08-11 기획)

### 교육생 (P3-T05)

- **교육생은 담당자가 아니라 포지션에 속한다.** 멘토를 매다는 필드도 흐름도 만들지 않아 정식 배정자가 바뀌어도 교육생은 그대로 남는다. 이 결정으로 PRD 교육생 절의 「담당자와 포지션에 연결한다」와 「한 담당자당」이 각각 「포지션에 연결한다」와 「한 포지션당」으로 바뀌었다. — [PRD 교육생 절](PRD.md) · [ADMIN-FLOWS 관리자 예외 규칙 절](design/ADMIN-FLOWS.md) (2026-08-11 기획)
- **한 사람은 같은 스케줄에서 한 자리만 갖는다.** 정식 배정과 교육생을 겸하지 못하고 두 포지션의 교육생도 되지 못하며, 어느 쪽이 먼저든 나중 것이 거부된다. 정식 배정끼리의 겸직은 P3-T04 결정대로 상한 없이 열려 있어 이 제한은 교육생 쪽에만 걸린다. — [PRD 교육생 절](PRD.md) · [phase P3-T05 절](../execution/phases/03-assignment-and-confirmation.md) (2026-08-11 기획)
- **한 포지션에 붙는 교육생 수에는 상한이 없다.** 셋 이상도 저장되고 경고도 띄우지 않는다. 교육생은 필요 인원 집계에 들어가지 않아 미달 판정을 흔들지 않는다(`INV-STAFF-02`). — [PRD 교육생 절](PRD.md) (2026-08-11 기획)
- **교육생이 있을 때만 `· 교육 K`를 덧붙인다.** 한 명도 없는 포지션은 `필요 N · 배정 M`에서 끝나며, 이는 겹칠 때만 실인원 줄을 띄우는 P3-T04 결정과 같은 결이다. — [ADMIN-FLOWS 관리자 예외 규칙 절](design/ADMIN-FLOWS.md) (2026-08-11 기획)
- **정식 배정자를 다 뺀 포지션에도 교육생은 남는다.** 화면에서 `담당자 없음`으로 보이고 확정을 막는 경고는 P3-T06이 다른 경고들과 함께 만든다. — [ADMIN-FLOWS 관리자 예외 규칙 절](design/ADMIN-FLOWS.md) · [phase P3-T05 절](../execution/phases/03-assignment-and-confirmation.md) (2026-08-11 기획)

## ATTENDANCE · NOTIFICATIONS · PAY

- **아직 인터뷰 결정 없음.** P4 알림의 오늘/이번 주 경계는 로컬 시간대 계산 후보로 기록돼 있다(설계 시점 결정).
