import {
  INITIAL_NOTIFICATION_PROMPT_VIEW,
  transitionNotificationPromptView,
} from "@/screens/pending/model/notificationPrompt";

describe("알림 영역 — 들어왔을 때 기본 모습은 아직 안 켬이다", () => {
  it("초기 모습은 기기 상태를 묻지 않고 아직 안 켬으로 시작한다", () => {
    expect(INITIAL_NOTIFICATION_PROMPT_VIEW).toBe("idle");
  });
});

describe("transitionNotificationPromptView — 권한 요청 결과로만 모습이 바뀐다", () => {
  it("권한 요청이 허용되면 켠 뒤 모습으로 전이한다", () => {
    const next = transitionNotificationPromptView("idle", "granted");

    expect(next).toBe("enabled");
  });

  it("권한 요청을 거부하면 거부한 뒤 모습으로 전이한다 — 셋째 모습이다", () => {
    const next = transitionNotificationPromptView("idle", "denied");

    expect(next).toBe("denied");
  });

  it("권한 요청 자체가 안 먹히는 기기도 같은 거부한 뒤 모습으로 전이한다 — 넷째 모습을 안 만든다", () => {
    const next = transitionNotificationPromptView("idle", "unsupported");

    expect(next).toBe("denied");
  });
});
