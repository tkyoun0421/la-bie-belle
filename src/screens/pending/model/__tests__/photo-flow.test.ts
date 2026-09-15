import { describe, expect, it } from "vitest";
import {
  reducePhoto,
  type PhotoState,
} from "@/screens/pending/model/photo-flow";

const IDLE: PhotoState = { uploading: false, failed: false };

describe("reducePhoto — 사진 올리기 상태를 옮긴다", () => {
  it("start면 올리는 중으로 바뀌고 실패 표시는 꺼진다", () => {
    expect(reducePhoto(IDLE, { type: "start" })).toEqual({
      uploading: true,
      failed: false,
    });
  });

  it("succeeded면 올리는 중과 실패 표시가 둘 다 꺼진다", () => {
    const uploading: PhotoState = { uploading: true, failed: false };

    expect(reducePhoto(uploading, { type: "succeeded" })).toEqual({
      uploading: false,
      failed: false,
    });
  });

  it("failed면 올리는 중은 꺼지고 실패 표시가 켜진다", () => {
    const uploading: PhotoState = { uploading: true, failed: false };

    expect(reducePhoto(uploading, { type: "failed" })).toEqual({
      uploading: false,
      failed: true,
    });
  });

  it("실패한 뒤 다시 start하면 실패 표시가 꺼진다", () => {
    const failedState: PhotoState = { uploading: false, failed: true };

    expect(reducePhoto(failedState, { type: "start" })).toEqual({
      uploading: true,
      failed: false,
    });
  });
});
