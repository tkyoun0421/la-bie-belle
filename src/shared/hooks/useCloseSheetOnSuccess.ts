import { useEffect } from "react";

export function useCloseSheetOnSuccess(
  succeeded: boolean,
  reset: () => void,
  leave: () => void,
): void {
  useEffect(() => {
    if (succeeded) {
      leave();
      reset();
    }
  }, [succeeded, reset, leave]);
}
