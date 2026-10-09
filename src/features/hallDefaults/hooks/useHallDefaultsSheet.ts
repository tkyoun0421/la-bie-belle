import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";
import type { HallSlot } from "@/entities/hall/model/hall.type";
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
  saving: boolean;
  failed: boolean;
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
    saving: isPending,
    failed: isError,
    writeStarts: setStarts,
    writeEnds: setEnds,
    save,
  };
}
