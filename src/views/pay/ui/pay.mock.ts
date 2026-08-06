import {
  EMPTY_MONTH_ESTIMATED_PAY,
  ESTIMATED_PAY_WITH_ITEMS,
} from "@/entities/pay/model/estimated-pay.mock";
import { REHEARSAL_ENTRIES } from "@/entities/pay/model/rehearsal-entry.mock";

export const PAY_WITH_ITEMS = {
  estimatedPay: ESTIMATED_PAY_WITH_ITEMS,
  rehearsalEntries: REHEARSAL_ENTRIES,
};

export const PAY_EMPTY_MONTH = {
  estimatedPay: EMPTY_MONTH_ESTIMATED_PAY,
  rehearsalEntries: [],
};
