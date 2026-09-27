// 여러 플로우(pending·left·blocked·retry·session·schedule-worker)가 나눠 쓰는 준비
// 절차다. runScript로 이 파일을 부르면 로컬 시드 서버(scripts/e2e-seed-server.mts,
// 127.0.0.1:8765)에 사용자 상태를 만들어 달라고 요청하고, 돌아온 세션 토큰을
// output에 실어 그 다음 스텝의 `openLink`가 쓰게 한다.
//
// 부르는 쪽은 env로 STATE를 준다. 값은
// "fresh" | "submitted" | "approved" | "admin" | "rejected" | "left" | "blocked" |
// "read_failure" | "schedule_submission_window" | "schedule_confirmed" |
// "schedule_admin_empty_month" | "schedule_admin_race_open" |
// "schedule_admin_confirmable" | "schedule_admin_confirmed" |
// "schedule_admin_applications" | "schedule_assign_day" |
// "schedule_admin_request_slot" | "schedule_worker_request_pending" |
// "schedule_worker_request_claimed" | "schedule_approvals_cancel_pending" 중
// 하나다(마지막 넷은 schedule-requests task가 더한다 — 계약은
// tests/e2e/schedule-admin.yaml·schedule-worker.yaml·approvals.yaml 머리말). NAME은 선택이고, 프로필을
// 보내는 상태에서 그 사람의 이름을 고른다 — 한 화면에 승인된 사람을 여럿 세우는
// members.yaml이 쓴다. 안 주면 시드 서버의 기본 이름이다. MONTH·DAY도 선택이고
// schedule_admin_race_open만 쓴다 — 이미 로그인된 세션 밖에서 먼저 열 날짜다.
// 계약과 상태별 응답 값은 scripts/e2e-seed-server.mts가 정본이다.
//
// NAME·MONTH·DAY가 env에 없으면 그 이름의 전역 자체가 없다 — 그래서 typeof로 먼저
// 묻는다. 바로 읽으면 그것을 안 주는 플로우(pending·left·blocked·retry·session·
// schedule-worker)가 ReferenceError로 죽는다.
//
// http·output은 Maestro의 JS 실행기가 주는 전역이다. 여기서 실제로 이 값들이
// 계약대로 동작하는지는 아직 못 봤다 — Maestro CLI로 한 번도 못 돌려봤다는 것이
// 이 task 리턴의 「실행」 절이 적은 그대로다. http.post의 옵션 모양과 응답의
// body가 문자열인지 이미 파싱된 객체인지는 Maestro 문서와 실제 실행으로
// 확인해야 하는 자리로 남는다.

/**
 * Maestro의 텍스트 셀렉터는 정규식이다(tests/e2e/README 격 관례,
 * members.yaml·profile.yaml이 물음표를 "\\?"로 직접 이스케이프하는 것과 같은
 * 이유). 이 파일이 넘기는 값 중 요일을 괄호로 붙이는 라벨
 * (writing.md 162번째 줄 "9월 12일(토)" 표기)은 "(", ")"를 그대로 담고 있어
 * `${output.foo}`로 assertVisible 패턴에 꽂으면 그 괄호가 리터럴이 아니라 정규식
 * 그룹으로 읽혀 매칭이 깨진다. 화면 문구를 직접 타이핑하는 자리는 사람이 눈으로
 * 보고 이스케이프하지만, 시드 서버가 돌려주는 동적 값은 그 자리에서 이스케이프할
 * 수 없으므로 여기서 한 번에 처리해 내보낸다.
 */
function escapeForTextSelector(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const chosenName = typeof NAME === "string" && NAME !== "" ? NAME : undefined;
const chosenMonth =
  typeof MONTH === "string" && MONTH !== "" ? MONTH : undefined;
const chosenDay = typeof DAY === "string" && DAY !== "" ? DAY : undefined;

const response = http.post("http://127.0.0.1:8765/seed", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    state: STATE,
    name: chosenName,
    month: chosenMonth,
    day: chosenDay,
  }),
});

if (response.status !== 200) {
  throw new Error(
    `시드 서버가 상태 ${STATE}에 ${response.status}를 돌려줬다: ${response.body}`,
  );
}

const seeded = JSON.parse(response.body);

output.accessToken = seeded.access_token;
output.refreshToken = seeded.refresh_token;
output.userId = seeded.user_id;
// read_failure 상태는 토큰은 정상이고 simulate 값만 따라온다 — 테스트 문이 이 값을 받아
// 게이트의 프로필 읽기를 한 번 실패시킨다(개발 빌드에서만).
output.simulate = seeded.simulate || "";

if (seeded.profile) {
  output.profileName = seeded.profile.name;
  output.profileGender = seeded.profile.gender;
  output.profileBirthDate = seeded.profile.birthDate;
  output.profilePhone = seeded.profile.phone;
  // 화면은 원값이 아니라 한글 문구·조사 뗀 날짜로 보여준다
  // (profile.md 문안 표, members-pending.md 상세 시트와 같은 표기). profile.yaml이
  // 원값 대신 이 둘을 쓴다 — "male"·"1990-11-05"는 화면 어디에도 그대로 안 뜬다.
  output.profileGenderLabel =
    seeded.profile.gender === "female" ? "여성" : "남성";
  const [birthYear, birthMonth, birthDay] = seeded.profile.birthDate.split("-");
  output.profileBirthDateLabel = `${birthYear}년 ${Number(birthMonth)}월 ${Number(birthDay)}일`;
}

// schedule_submission_window·schedule_confirmed 전용 필드다. 계약은
// tests/e2e/schedule-worker.yaml 머리말에 있다 — 두 상태 다 "그 달"의 raw
// 값(month, "YYYY-MM")과 화면에 그대로 뜨는 한글 라벨을 함께 돌려준다. raw
// month는 "?month=" 딥링크와 "schedule-day-${output.month}-01" 같은 testID
// 조립에 쓰고, 라벨 셋(monthLabel·deadlineLabel·myDateLabel·otherDateLabel)은
// 화면 문구를 그대로 단언하는 데 쓴다 — 이 넷은 escapeForTextSelector를 거쳐야
// 괄호 있는 요일 표기("6월 1일(일)")가 정규식으로 안 깨진다.
// schedule-worker-test-plan.md 8번 결정이 딱 이 다섯 필드까지고 그 이상은 안
// 늘린다.
if (seeded.month) {
  output.month = seeded.month;
  output.monthLabel = escapeForTextSelector(seeded.monthLabel);
}

if (seeded.deadlineLabel) {
  output.deadlineLabel = escapeForTextSelector(seeded.deadlineLabel);
}

if (seeded.myDateLabel) {
  output.myDateLabel = escapeForTextSelector(seeded.myDateLabel);
}

if (seeded.otherDateLabel) {
  output.otherDateLabel = escapeForTextSelector(seeded.otherDateLabel);
}

// schedule_admin_empty_month 전용이다. 화면에 뜨는 문구가 아니라 만들기 시트의 날짜
// 입력에 그대로 타이핑할 값이라 escapeForTextSelector를 안 거친다 — 이스케이프하면
// 입력 칸에 역슬래시가 들어간다.
if (seeded.deadlineDate) {
  output.deadlineDate = seeded.deadlineDate;
}

// schedule_assign_day 전용이다. 화면 문구가 아니라 날 상세 딥링크("?date=${month}-${day}")를
// 조립할 raw "DD"라 deadlineDate와 같은 이유로 escapeForTextSelector를 안 거친다.
if (seeded.day) {
  output.day = seeded.day;
}

// schedule_admin_race_open 전용이다. 부분 실패 토스트가 그대로 부르는 날짜라
// (schedule-admin.md 「날 열기 모드 문안」) 다른 동적 라벨과 같은 손을 탄다 — 지금 꼴엔
// 정규식 특수문자가 없지만 표기가 바뀌어도 안 깨지게 둔다.
if (seeded.failedOpenDayLabel) {
  output.failedOpenDayLabel = escapeForTextSelector(seeded.failedOpenDayLabel);
}

// schedule_worker_request_claimed 전용이다(schedule-requests task,
// tests/e2e/schedule-worker.yaml 머리말). 늦은 수락 뒤 달력 아래 줄에 남는 사건
// 문구다 — "10월 1일 안내 자리는 다른 분이 맡았어요" 꼴로 화면에 그대로 찍힌다.
if (seeded.slotClaimedLabel) {
  output.slotClaimedLabel = escapeForTextSelector(seeded.slotClaimedLabel);
}

// schedule_approvals_cancel_pending 전용 넷이다(schedule-requests task,
// tests/e2e/approvals.yaml 머리말) — 승인할 일 목록 줄, 상세 시트 제목, 근무
// 취소 확인 Dialog 본문. 전부 화면에 그대로 찍히는 문구라 이스케이프한다.
if (seeded.approvalListTitle) {
  output.approvalListTitle = escapeForTextSelector(seeded.approvalListTitle);
}

if (seeded.approvalDetailTitle) {
  output.approvalDetailTitle = escapeForTextSelector(
    seeded.approvalDetailTitle,
  );
}

if (seeded.approvalConfirmBody) {
  output.approvalConfirmBody = escapeForTextSelector(
    seeded.approvalConfirmBody,
  );
}

if (seeded.approvalDayAppbar) {
  output.approvalDayAppbar = escapeForTextSelector(seeded.approvalDayAppbar);
}
