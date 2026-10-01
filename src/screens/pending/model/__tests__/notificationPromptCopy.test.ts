const { getNotificationPromptCopy } =
  await import("@/screens/pending/model/notificationPromptCopy");

describe("getNotificationPromptCopy — 아직 안 켬은 제목과 켜기 버튼이 있는 안내다", () => {
  it("idle 모습은 승인 문구와 버튼을 낸다", () => {
    expect(getNotificationPromptCopy("idle")).toEqual({
      title: "승인되면 알려드릴까요?",
      subline: "알림을 켜두면 앱을 안 열어도 알 수 있어요",
      hasButton: true,
    });
  });
});

describe("getNotificationPromptCopy — 켠 뒤는 버튼 없이 약속하는 문구다", () => {
  it("enabled 모습은 버튼이 없다", () => {
    expect(getNotificationPromptCopy("enabled")).toEqual({
      title: "승인되면 알려드릴게요",
      subline: "알림은 설정에서 언제든 끌 수 있어요",
      hasButton: false,
    });
  });
});

describe("getNotificationPromptCopy — 거부한 뒤는 버튼 없이 설정으로 가는 안내다", () => {
  it("denied 모습은 버튼이 없다", () => {
    expect(getNotificationPromptCopy("denied")).toEqual({
      title: "알림이 꺼져 있어요",
      subline: "기기 설정에서 알림을 켜면 받을 수 있어요",
      hasButton: false,
    });
  });
});

describe("getNotificationPromptCopy — 거부한 뒤 문장은 「나」 화면의 알림 안내와 같다", () => {
  it("denied 모습의 제목과 아래 줄이 프로필 알림 안내 문구와 일치한다", async () => {
    const { getProfileNotificationRow } =
      await import("@/entities/notification/model/profileNotificationRow");

    const promptCopy = getNotificationPromptCopy("denied");
    const profileRow = getProfileNotificationRow("denied", false);

    expect(promptCopy.title).toBe(profileRow.title);
    expect(promptCopy.subline).toBe(profileRow.subline);
  });
});
