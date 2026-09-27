import { jest } from "@jest/globals";
import { exportQrPaper } from "@/features/attendance/model/export-qr-paper";

const HTML = "<html>fake</html>";

describe("exportQrPaper — 인쇄용 종이를 파일로 만들어 공유 판에 넘긴다", () => {
  it("printToFile을 { html }로 부른다", async () => {
    const printToFile = jest
      .fn<(args: { html: string }) => Promise<{ uri: string }>>()
      .mockResolvedValue({ uri: "file://paper.pdf" });
    const share = jest
      .fn<(...args: unknown[]) => Promise<void>>()
      .mockResolvedValue(undefined);

    await exportQrPaper({ html: HTML, printToFile, share });

    expect(printToFile).toHaveBeenCalledWith({ html: HTML });
  });

  it("printToFile이 낸 uri를 지정한 mimeType·UTI로 share에 넘긴다", async () => {
    const printToFile = jest
      .fn<(args: { html: string }) => Promise<{ uri: string }>>()
      .mockResolvedValue({ uri: "file://paper.pdf" });
    const share = jest
      .fn<(...args: unknown[]) => Promise<void>>()
      .mockResolvedValue(undefined);

    await exportQrPaper({ html: HTML, printToFile, share });

    expect(share).toHaveBeenCalledWith("file://paper.pdf", {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
    });
  });

  it("printToFile을 먼저 부르고 그 뒤에 share를 부른다", async () => {
    const printToFile = jest
      .fn<(args: { html: string }) => Promise<{ uri: string }>>()
      .mockResolvedValue({ uri: "file://paper.pdf" });
    const share = jest
      .fn<(...args: unknown[]) => Promise<void>>()
      .mockResolvedValue(undefined);

    await exportQrPaper({ html: HTML, printToFile, share });

    const printOrder = printToFile.mock.invocationCallOrder[0];
    const shareOrder = share.mock.invocationCallOrder[0];

    expect(printOrder).toBeLessThan(shareOrder as number);
  });

  it("printToFile이 실패하면 그 오류를 그대로 던지고 share는 안 부른다", async () => {
    const error = new Error("파일을 못 만들었다");
    const printToFile = jest
      .fn<(args: { html: string }) => Promise<{ uri: string }>>()
      .mockRejectedValue(error);
    const share = jest
      .fn<(...args: unknown[]) => Promise<void>>()
      .mockResolvedValue(undefined);

    await expect(
      exportQrPaper({ html: HTML, printToFile, share }),
    ).rejects.toBe(error);
    expect(share).not.toHaveBeenCalled();
  });

  it("share가 실패하면 그 오류를 그대로 던진다", async () => {
    const error = new Error("공유 판을 못 열었다");
    const printToFile = jest
      .fn<(args: { html: string }) => Promise<{ uri: string }>>()
      .mockResolvedValue({ uri: "file://paper.pdf" });
    const share = jest
      .fn<(...args: unknown[]) => Promise<void>>()
      .mockRejectedValue(error);

    await expect(
      exportQrPaper({ html: HTML, printToFile, share }),
    ).rejects.toBe(error);
  });
});
