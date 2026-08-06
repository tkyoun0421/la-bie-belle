import type { EstimatedPay } from "@/entities/pay/model/estimated-pay";

export const ESTIMATED_PAY_WITH_ITEMS: EstimatedPay = {
  month: "2026-08",
  totalAmount: 495000,
  regularAmount: 450000,
  rehearsalAmount: 45000,
  items: [
    { date: "2026-08-02", label: "플로어", amount: 108000 },
    { date: "2026-08-09", label: "플로어", amount: 108000 },
    { date: "2026-08-11", label: "리허설", amount: 45000 },
    { date: "2026-08-16", label: "주차", amount: 117000 },
    { date: "2026-08-23", label: "플로어", amount: 117000 },
  ],
};

export const EMPTY_MONTH_ESTIMATED_PAY: EstimatedPay = {
  month: "2026-09",
  totalAmount: 0,
  regularAmount: 0,
  rehearsalAmount: 0,
  items: [],
};

export const ESTIMATED_PAY_WITH_REHEARSAL: EstimatedPay = ESTIMATED_PAY_WITH_ITEMS;
