export function maskDigits(formatted: string): string {
  return formatted.replace(/\d/g, "0");
}
