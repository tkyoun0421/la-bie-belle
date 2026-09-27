/**
 * 인쇄용 종이를 파일로 굽고 기기의 공유 판에 넘긴다. 인쇄할지 파일로 저장할지 누구에게
 * 보낼지는 관리자가 거기서 고른다
 * (`docs/2-design/modules/attendance/screens/qr.md`의 「내보내기」).
 *
 * **굽는 손과 여는 손을 주입받는다.** 둘 다 기기 모듈이라 화면(`.tsx`)이 `expo-print`와
 * `expo-sharing`을 꽂고, 이 자리는 순서와 넘기는 값만 든다.
 *
 * **서버에 파일을 안 둔다.** 저장해 두면 새로 뽑은 뒤에 옛 그림이 남고, 그 종이가 붙은 채
 * 근무자가 `invalid_qr`을 받는다(`docs/2-design/modules/attendance/design.md`의
 * 「인쇄용 종이 내보내기」).
 *
 * **사진첩에 안 남긴다.** 그러려면 사진 권한을 받아야 하는데 인쇄가 목적인 종이를 거기 둘
 * 이유가 없다.
 *
 * 실패는 감싸지 않고 그대로 올린다 — 화면이 토스트 한 줄로 받는다.
 */

const PDF_MIME_TYPE = "application/pdf";

const PDF_UTI = "com.adobe.pdf";

export type QrPaperShareOptions = {
  mimeType: string;
  UTI: string;
};

export type ExportQrPaperInput = {
  html: string;
  printToFile: (options: { html: string }) => Promise<{ uri: string }>;
  share: (uri: string, options: QrPaperShareOptions) => Promise<void>;
};

export async function exportQrPaper({
  html,
  printToFile,
  share,
}: ExportQrPaperInput): Promise<void> {
  const { uri } = await printToFile({ html });

  await share(uri, { mimeType: PDF_MIME_TYPE, UTI: PDF_UTI });
}
