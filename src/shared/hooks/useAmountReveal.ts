import { useState } from "react";

export type UseAmountRevealResult = {
  readonly masked: boolean;
  readonly revealing: boolean;
  readonly reveal: () => void;
};

export function useAmountReveal(maskedByDefault: boolean): UseAmountRevealResult {
  const [revealedByHand, setRevealedByHand] = useState(false);

  return {
    masked: revealedByHand ? false : maskedByDefault,
    revealing: revealedByHand,
    reveal: () => setRevealedByHand(true),
  };
}
