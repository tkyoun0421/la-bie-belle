export type PayLineItem = {
  date: string;
  label: string;
  amount: number;
};

export type EstimatedPay = {
  month: string;
  totalAmount: number;
  regularAmount: number;
  rehearsalAmount: number;
  items: PayLineItem[];
};
