export type CheckInMethod = "location" | "qr";

export type CheckInParams = {
  dayId: string;
  reportedAt: string;
  method: CheckInMethod;
  lat?: number | null;
  lng?: number | null;
  qrCode?: string | null;
};
