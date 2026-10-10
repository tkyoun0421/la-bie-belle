import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import type { HallSlot } from "@/entities/hall/model/hall.type";
import { HALL_DEFAULTS_COPY } from "@/features/hallDefaults/consts/hallDefaults.const";
import { useSetHallDefaultsMutation } from "@/features/hallDefaults/services/useSetHallDefaultsMutation";

export type HallDefaultsSheetInput = {
  starts: string;
  ends: string;
  slots: HallSlot[];
  onSaved: () => void;
};

export type HallDefaultsSheetController = {
  starts: string;
  ends: string;
  sending: boolean;
  failedLine: string | null;
  writeStarts: (typed: string) => void;
  writeEnds: (typed: string) => void;
  save: () => void;
};

export function useHallDefaultsSheet({
  starts: given,
  ends: givenEnds,
  slots,
  onSaved,
}: HallDefaultsSheetInput): HallDefaultsSheetController {
  const [starts, setStarts] = useState(given);
  const [ends, setEnds] = useState(givenEnds);

  const {
    mutate: sendDefaults,
    isPending,
    isSuccess,
    isError,
  } = useSetHallDefaultsMutation(supabase);

  useEffect(() => {
    if (isSuccess) {
      onSaved();
    }
  }, [isSuccess, onSaved]);

  const save = useCallback(() => {
    sendDefaults({ slots, starts, ends });
  }, [sendDefaults, slots, starts, ends]);

  return {
    starts,
    ends,
    sending: isPending,
    failedLine: isError ? HALL_DEFAULTS_COPY.saveFailed : null,
    writeStarts: setStarts,
    writeEnds: setEnds,
    save,
  };
}
