import { useRef, useState } from "react";

import type { ScheduleApplicant } from "@/entities/schedule/model/schedule-applicant";
import type { ErrorCode } from "@/shared/config/error-codes.config";

export type ListApplicantsInput = { scheduleId: string };

export type ListApplicantsOutcome =
  { ok: true; applicants: ScheduleApplicant[] } | { ok: false; code: ErrorCode };

export function useScheduleApplicants(
  onList: (input: ListApplicantsInput) => Promise<ListApplicantsOutcome>,
) {
  const [applicants, setApplicants] = useState<ScheduleApplicant[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const requestIdRef = useRef(0);

  function load(scheduleId: string) {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setApplicants(null);
    setFailed(false);
    setLoading(true);

    void onList({ scheduleId }).then((outcome) => {
      if (requestIdRef.current !== requestId) {
        return;
      }
      setLoading(false);
      if (outcome.ok) {
        setApplicants(outcome.applicants);
        return;
      }
      setFailed(true);
    });
  }

  function reset() {
    requestIdRef.current += 1;
    setApplicants(null);
    setLoading(false);
    setFailed(false);
  }

  return { applicants, loading, failed, load, reset };
}
