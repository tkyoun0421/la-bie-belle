// 여러 플로우(pending·left·blocked·retry·session)가 나눠 쓰는 준비 절차다.
// runScript로 이 파일을 부르면 로컬 시드 서버(scripts/e2e-seed-server.mts,
// 127.0.0.1:8765 — 아직 없다. implementer가 이 task에서 세운다)에 사용자 상태를
// 만들어 달라고 요청하고, 돌아온 세션 토큰을 output에 실어 그 다음 스텝의
// `openLink`가 쓰게 한다.
//
// 부르는 쪽은 env로 STATE 하나만 준다. 값은
// "fresh" | "submitted" | "rejected" | "left" | "blocked" | "read_failure" 중 하나다.
// 계약과 상태별 응답 값은 이 task의 리턴에 적은 표가 정본이고, implementer가
// scripts/e2e-seed-server.mts를 그 표대로 세운다.
//
// http·output은 Maestro의 JS 실행기가 주는 전역이다. 여기서 실제로 이 값들이
// 계약대로 동작하는지는 아직 못 봤다 — Maestro CLI로 한 번도 못 돌려봤다는 것이
// 이 task 리턴의 「실행」 절이 적은 그대로다. http.post의 옵션 모양과 응답의
// body가 문자열인지 이미 파싱된 객체인지는 Maestro 문서와 실제 실행으로
// 확인해야 하는 자리로 남는다.

const response = http.post("http://127.0.0.1:8765/seed", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ state: STATE }),
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
}
