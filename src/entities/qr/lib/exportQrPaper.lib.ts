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
