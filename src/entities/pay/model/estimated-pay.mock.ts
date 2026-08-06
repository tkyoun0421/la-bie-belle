import {
  HEAVY_REHEARSAL_ENTRIES,
  REHEARSAL_ENTRIES,
} from "@/entities/pay/model/rehearsal-entry.mock";
import type { EstimatedPay } from "@/entities/pay/model/estimated-pay";

function sumAmount(entries: { amount: number }[]) {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}

const REGULAR_AMOUNT = 450000;
const REHEARSAL_AMOUNT = sumAmount(REHEARSAL_ENTRIES);

export const ESTIMATED_PAY_WITH_ITEMS: EstimatedPay = {
  month: "2026-08",
  totalAmount: REGULAR_AMOUNT + REHEARSAL_AMOUNT,
  regularAmount: REGULAR_AMOUNT,
  rehearsalAmount: REHEARSAL_AMOUNT,
  items: [
    { date: "2026-08-02", label: "플로어", amount: 108000 },
    { date: "2026-08-09", label: "플로어", amount: 108000 },
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

const HEAVY_REGULAR_AMOUNT = 108000;
const HEAVY_REHEARSAL_AMOUNT = sumAmount(HEAVY_REHEARSAL_ENTRIES);

export const ESTIMATED_PAY_WITH_REHEARSAL: EstimatedPay = {
  month: "2026-08",
  totalAmount: HEAVY_REGULAR_AMOUNT + HEAVY_REHEARSAL_AMOUNT,
  regularAmount: HEAVY_REGULAR_AMOUNT,
  rehearsalAmount: HEAVY_REHEARSAL_AMOUNT,
  items: [{ date: "2026-08-09", label: "플로어", amount: HEAVY_REGULAR_AMOUNT }],
};
