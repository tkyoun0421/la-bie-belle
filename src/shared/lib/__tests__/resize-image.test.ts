import { describe, expect, it, vi } from "vitest";
import { cropSquare, resizeToSquareWebp } from "@/shared/lib/resize-image";

describe("cropSquare — 가운데를 기준으로 정사각 자르기 좌표를 낸다", () => {
  it("가로가 길면 좌우를 잘라 가운데 자름 값을 낸다", () => {
    expect(cropSquare(800, 600)).toEqual({ sx: 100, sy: 0, side: 600 });
  });

  it("세로가 길면 위아래를 잘라 가운데 자름 값을 낸다", () => {
    expect(cropSquare(600, 800)).toEqual({ sx: 0, sy: 100, side: 600 });
  });

  it("이미 정사각이면 자름 값이 0이다", () => {
    expect(cropSquare(500, 500)).toEqual({ sx: 0, sy: 0, side: 500 });
  });
});

type FakeBitmap = { width: number; height: number };

function fakeBitmap(width: number, height: number): FakeBitmap {
  return { width, height };
}

function fakeCanvas(blobResult: Blob | null) {
  const drawImage = vi.fn();
  const toBlob = vi.fn((callback: (blob: Blob | null) => void) =>
    callback(blobResult),
  );
  const canvasLike = {
    getContext: () => ({ drawImage }),
    toBlob,
  };

  return { canvasLike, drawImage, toBlob };
}

describe("resizeToSquareWebp — 주입한 canvas 의존으로 호출 인자를 본다", () => {
  it("가운데를 잘라 지정한 크기로 그리고 webp로 인코딩을 요청한다", async () => {
    const bitmap = fakeBitmap(800, 600);
    const resultBlob = new Blob(["webp"], { type: "image/webp" });
    const { canvasLike, drawImage, toBlob } = fakeCanvas(resultBlob);
    const createBitmap = vi.fn().mockResolvedValue(bitmap);
    const createCanvas = vi.fn().mockReturnValue(canvasLike);
    const file = new Blob(["원본"], { type: "image/png" });

    const result = await resizeToSquareWebp(file, {
      size: 512,
      createBitmap,
      createCanvas,
    });

    expect(drawImage).toHaveBeenCalledWith(
      bitmap,
      100,
      0,
      600,
      600,
      0,
      0,
      512,
      512,
    );
    expect(toBlob.mock.calls[0]?.[1]).toBe("image/webp");
    expect(result).toBe(resultBlob);
  });

  it("toBlob이 null을 주면 거부한다", async () => {
    const bitmap = fakeBitmap(500, 500);
    const { canvasLike } = fakeCanvas(null);
    const createBitmap = vi.fn().mockResolvedValue(bitmap);
    const createCanvas = vi.fn().mockReturnValue(canvasLike);
    const file = new Blob(["원본"], { type: "image/png" });

    await expect(
      resizeToSquareWebp(file, { size: 512, createBitmap, createCanvas }),
    ).rejects.toThrow();
  });
});
