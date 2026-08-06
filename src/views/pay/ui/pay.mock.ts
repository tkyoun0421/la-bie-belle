import {
  EMPTY_MONTH_ESTIMATED_PAY,
  ESTIMATED_PAY_WITH_ITEMS,
  ESTIMATED_PAY_WITH_REHEARSAL,
} from "@/entities/pay/model/estimated-pay.mock";
import {
  HEAVY_REHEARSAL_ENTRIES,
  REHEARSAL_ENTRIES,
} from "@/entities/pay/model/rehearsal-entry.mock";

export const PAY_WITH_ITEMS = {
  estimatedPay: ESTIMATED_PAY_WITH_ITEMS,
  rehearsalEntries: REHEARSAL_ENTRIES,
};

export const PAY_EMPTY_MONTH = {
  estimatedPay: EMPTY_MONTH_ESTIMATED_PAY,
  rehearsalEntries: [],
};

export const PAY_WITH_HEAVY_REHEARSAL = {
  estimatedPay: ESTIMATED_PAY_WITH_REHEARSAL,
  rehearsalEntries: HEAVY_REHEARSAL_ENTRIES,
};
