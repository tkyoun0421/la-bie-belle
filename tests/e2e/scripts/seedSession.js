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
output.simulate = seeded.simulate || "";

if (seeded.profile) {
  output.profileName = seeded.profile.name;
  output.profileGender = seeded.profile.gender;
  output.profileBirthDate = seeded.profile.birthDate;
  output.profilePhone = seeded.profile.phone;
  output.profileGenderLabel =
    seeded.profile.gender === "female" ? "여성" : "남성";
  const [birthYear, birthMonth, birthDay] = seeded.profile.birthDate.split("-");
  output.profileBirthDateLabel = `${birthYear}년 ${Number(birthMonth)}월 ${Number(birthDay)}일`;
}

if (seeded.month) {
  output.month = seeded.month;
}

if (seeded.monthLabel) {
  output.monthLabel = escapeForTextSelector(seeded.monthLabel);
} else if (seeded.month) {
  const [rehearsalYear, rehearsalMonthText] = seeded.month.split("-");
  output.monthLabel = `${rehearsalYear}년 ${Number(rehearsalMonthText)}월`;
}

if (seeded.assignedDate) {
  output.assignedDate = seeded.assignedDate;
}

if (seeded.freeDate) {
  output.freeDate = seeded.freeDate;
}

if (seeded.assignedDateLabel) {
  output.assignedDateLabel = escapeForTextSelector(seeded.assignedDateLabel);
}

if (seeded.freeDateLabel) {
  output.freeDateLabel = escapeForTextSelector(seeded.freeDateLabel);
}

if (seeded.month) {
  const [pickerYear, pickerMonthText] = seeded.month.split("-");
  const pickerMonthNumber = Number(pickerMonthText);
  const otherMonthNumber = pickerMonthNumber === 3 ? 4 : 3;

  output.otherMonthButtonLabel = `${otherMonthNumber}월`;
  output.otherMonthLabel = `${pickerYear}년 ${otherMonthNumber}월`;
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

if (seeded.deadlineDate) {
  output.deadlineDate = seeded.deadlineDate;
}

if (seeded.day) {
  output.day = seeded.day;
}

if (seeded.holidayDay) {
  output.holidayDay = seeded.holidayDay;
}

if (seeded.failedOpenDayLabel) {
  output.failedOpenDayLabel = escapeForTextSelector(seeded.failedOpenDayLabel);
}

if (seeded.slotClaimedLabel) {
  output.slotClaimedLabel = escapeForTextSelector(seeded.slotClaimedLabel);
}

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

if (seeded.statsWorkMonthLabel) {
  output.statsWorkMonthLabel = escapeForTextSelector(
    seeded.statsWorkMonthLabel,
  );
}

if (seeded.statsSecondMonthLabel) {
  output.statsSecondMonthLabel = escapeForTextSelector(
    seeded.statsSecondMonthLabel,
  );
}

if (seeded.statsEmptyMonthLabel) {
  output.statsEmptyMonthLabel = escapeForTextSelector(
    seeded.statsEmptyMonthLabel,
  );
}

if (seeded.statsWorkerMonthLabel) {
  output.statsWorkerMonthLabel = escapeForTextSelector(
    seeded.statsWorkerMonthLabel,
  );
}

if (seeded.statsWorkerPresentDateLabel) {
  output.statsWorkerPresentDateLabel = escapeForTextSelector(
    seeded.statsWorkerPresentDateLabel,
  );
}

if (seeded.statsWorkerLateDateLabel) {
  output.statsWorkerLateDateLabel = escapeForTextSelector(
    seeded.statsWorkerLateDateLabel,
  );
}

if (seeded.statsWorkerAbsentDateLabel) {
  output.statsWorkerAbsentDateLabel = escapeForTextSelector(
    seeded.statsWorkerAbsentDateLabel,
  );
}

if (seeded.statsWorkerExcusedDateLabel) {
  output.statsWorkerExcusedDateLabel = escapeForTextSelector(
    seeded.statsWorkerExcusedDateLabel,
  );
}
