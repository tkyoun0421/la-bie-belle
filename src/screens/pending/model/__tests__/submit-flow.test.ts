import { describe, expect, it } from "vitest";
import { toAppError } from "@/shared/api/errors";
import {
  reduceSubmit,
  type SubmitState,
} from "@/screens/pending/model/submit-flow";

const CLOSED: SubmitState = { sheet: "closed", message: null };
const OPEN: SubmitState = { sheet: "open", message: null };
const SENDING: SubmitState = { sheet: "sending", message: null };
const RETRY_MESSAGE = "보내지 못했어요. 다시 시도해주세요";

describe("reduceSubmit — 시트를 여닫고 보내는 상태를 옮긴다", () => {
  it("닫힌 시트에서 open 이벤트는 열린 시트로 옮긴다", () => {
    expect(reduceSubmit(CLOSED, { type: "open" })).toEqual(OPEN);
  });

  it("열린 시트에서 send 이벤트는 보내는 중으로 옮긴다", () => {
    expect(reduceSubmit(OPEN, { type: "send" })).toEqual(SENDING);
  });

  it("보내는 중에 succeeded면 닫힌 시트로 돌아가고 메시지가 비운다", () => {
    expect(reduceSubmit(SENDING, { type: "succeeded" })).toEqual(CLOSED);
  });

  it("close 이벤트는 상태와 무관하게 닫힌 시트로 옮기고 메시지를 비운다", () => {
    const dirty: SubmitState = { sheet: "open", message: RETRY_MESSAGE };

    expect(reduceSubmit(dirty, { type: "close" })).toEqual(CLOSED);
  });
});

describe("reduceSubmit — TransportError로 실패하면 시트를 연 채 재시도 문안을 띄운다", () => {
  it("보내는 중에 TransportError면 열린 시트에 재시도 문안이 선다", () => {
    const error = toAppError("network down");

    const next = reduceSubmit(SENDING, { type: "failed", error });

    expect(next).toEqual({ sheet: "open", message: RETRY_MESSAGE });
  });
});

describe("reduceSubmit — invalid_phone DomainError도 재시도 문안과 같다", () => {
  it("보내는 중에 invalid_phone DomainError면 TransportError와 같은 문안이 선다", () => {
    const error = toAppError({ message: "invalid_phone" });

    const next = reduceSubmit(SENDING, { type: "failed", error });

    expect(next).toEqual({ sheet: "open", message: RETRY_MESSAGE });
  });
});

describe("reduceSubmit — already_submitted DomainError는 성공과 같다", () => {
  it("보내는 중에 already_submitted DomainError면 성공과 같은 닫힌 상태로 옮긴다", () => {
    const error = toAppError({ message: "already_submitted" });

    const next = reduceSubmit(SENDING, { type: "failed", error });

    expect(next).toEqual(CLOSED);
  });
});
