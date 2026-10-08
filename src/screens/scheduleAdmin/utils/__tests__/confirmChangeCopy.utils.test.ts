import { confirmChangeCopyOf } from "@/screens/scheduleAdmin/utils/confirmChangeCopy.utils";

const UNREACHABLE = ["p9"];

function canNotify(profileId: string): boolean {
  return !UNREACHABLE.includes(profileId);
}

describe("confirmChangeCopyOf — 배정과 교육은 들어오는 사람만 싣는다", () => {
  it("배정은 kind를 그대로 옮긴다", () => {
    expect(
      confirmChangeCopyOf(
        {
          kind: "add",
          slotId: "s2",
          profileId: "p2",
          name: "박수진",
          skipQualification: false,
          grant: null,
        },
        canNotify,
      ),
    ).toEqual({
      kind: "add",
      incomingName: "박수진",
      incomingCanNotify: true,
    });
  });

  it("교육도 같은 꼴이다", () => {
    expect(
      confirmChangeCopyOf(
        {
          kind: "training",
          position: "스캔",
          profileId: "p2",
          name: "박수진",
        },
        canNotify,
      ),
    ).toEqual({
      kind: "training",
      incomingName: "박수진",
      incomingCanNotify: true,
    });
  });

  it("안 닿는 사람이면 거짓이 실린다", () => {
    expect(
      confirmChangeCopyOf(
        {
          kind: "add",
          slotId: "s2",
          profileId: "p9",
          name: "강하늘",
          skipQualification: false,
          grant: null,
        },
        canNotify,
      ),
    ).toEqual({
      kind: "add",
      incomingName: "강하늘",
      incomingCanNotify: false,
    });
  });
});

describe("confirmChangeCopyOf — 바꾸기는 둘을 싣는다", () => {
  it("나가는 사람과 들어오는 사람을 각각 묻는다", () => {
    expect(
      confirmChangeCopyOf(
        {
          kind: "swap",
          assignmentId: "a1",
          profileId: "p2",
          outgoingProfileId: "p9",
          outgoingName: "강하늘",
          incomingName: "박수진",
        },
        canNotify,
      ),
    ).toEqual({
      kind: "swap",
      outgoingName: "강하늘",
      outgoingCanNotify: false,
      incomingName: "박수진",
      incomingCanNotify: true,
    });
  });
});

describe("confirmChangeCopyOf — 빼기는 나가는 사람만 싣는다", () => {
  it("들어오는 이름이 없다", () => {
    expect(
      confirmChangeCopyOf(
        {
          kind: "remove",
          assignmentId: "a1",
          outgoingProfileId: "p1",
          outgoingName: "이준호",
        },
        canNotify,
      ),
    ).toEqual({
      kind: "remove",
      outgoingName: "이준호",
      outgoingCanNotify: true,
    });
  });
});
