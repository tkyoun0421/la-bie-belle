// 구현 대상: src/screens/scheduleWorker/utils/workerCopy.utils.ts
//
// 값이 들어가야 서는 문구 넷이다. 화면 파일 안에 지역 함수 셋과 템플릿 문자열 둘로
// 흩어져 있었다.
//
// **고정 문안과 갈라 둔다.** 글자가 안 바뀌는 것은 `consts/`가 들고 여기는 달과 요청과
// 근무를 받아 조립하는 손만 든다 — 조립을 `consts/`에 넣으려면 그 파일이 함수를 들어야
// 하고, 글자를 `utils/`에 넣으면 문안을 고칠 때 두 자리를 봐야 한다.
//
// **요청의 생 꼴을 통째로 안 받는다.** 쓰는 칸이 포지션 첫 줄과 날과 시각뿐이라, 받는
// 모양을 그만큼으로 좁혀야 이 자리가 DTO가 바뀔 때 같이 안 흔들린다.

const {
  cancelSheetTitle,
  claimedLine,
  requestSubtitle,
  spellNotOpen,
  spellSubmitted,
} = await import("@/screens/scheduleWorker/utils/workerCopy.utils");

const REQUEST = {
  slots: {
    positions: ["안내"],
    days: {
      work_date: "2026-10-17",
      starts_at: "10:00:00",
      ends_at: "18:00:00",
    },
  },
};

describe("workerCopy — 값이 들어가야 서는 문구들", () => {
  it("보낸 뒤 토스트가 그 달을 부른다", () => {
    expect(spellSubmitted("2026-10")).toBe("10월 근무 신청을 보냈어요");
  });

  it("한 자리 달은 0을 떼고 부른다", () => {
    expect(spellSubmitted("2026-03")).toBe("3월 근무 신청을 보냈어요");
  });

  it("아직 안 연 달은 열면 알려준다고 말한다", () => {
    expect(spellNotOpen("2026-12")).toBe(
      "아직 12월 근무 신청을 받지 않아요. 열리면 알려드릴게요",
    );
  });

  it("요청 시트 부제가 날·포지션·시각 셋을 가운뎃점으로 잇는다", () => {
    expect(requestSubtitle(REQUEST)).toBe(
      "10월 17일(토) · 안내 · 10:00 – 18:00",
    );
  });

  it("포지션이 비어 있어도 부제가 선다", () => {
    expect(
      requestSubtitle({
        ...REQUEST,
        slots: { ...REQUEST.slots, positions: [] },
      }),
    ).toBe("10월 17일(토) ·  · 10:00 – 18:00");
  });

  it("늦은 수락 줄은 요일을 안 붙인다", () => {
    expect(claimedLine(REQUEST)).toBe(
      "10월 17일 안내 자리는 다른 분이 맡았어요",
    );
  });

  it("취소 시트 제목이 그 날과 포지션을 든다", () => {
    expect(cancelSheetTitle("2026-10-17", "안내")).toBe(
      "근무 취소 · 10월 17일(토) 안내",
    );
  });
});
