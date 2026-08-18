import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "labiebelle:amount-masking";

type AmountMaskingState = {
  autoMaskOnWorkday: boolean;
  setAutoMaskOnWorkday: (autoMaskOnWorkday: boolean) => void;
};

export const useAmountMasking = create<AmountMaskingState>()(
  persist(
    (set) => ({
      autoMaskOnWorkday: true,
      setAutoMaskOnWorkday: (autoMaskOnWorkday) => set({ autoMaskOnWorkday }),
    }),
    {
      name: STORAGE_KEY,
      skipHydration: true,
    },
  ),
);
