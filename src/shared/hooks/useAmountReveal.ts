import { useState } from "react";

export type UseAmountRevealResult = {
  readonly masked: boolean;
  readonly revealing: boolean;
  readonly toggle: () => void;
  readonly settle: () => void;
};

type Hand = "none" | "open" | "close";

function maskedFor(hand: Hand, maskedByDefault: boolean): boolean {
  switch (hand) {
    case "none":
      return maskedByDefault;
    case "open":
      return false;
    case "close":
      return true;
  }
}

export function useAmountReveal(maskedByDefault: boolean): UseAmountRevealResult {
  const [hand, setHand] = useState<Hand>("none");
  const [revealing, setRevealing] = useState(false);

  const masked = maskedFor(hand, maskedByDefault);

  return {
    masked,
    revealing,
    toggle: () => {
      if (masked) {
        setHand("open");
        setRevealing(true);
      } else {
        setHand("close");
        setRevealing(false);
      }
    },
    settle: () => setRevealing(false),
  };
}
