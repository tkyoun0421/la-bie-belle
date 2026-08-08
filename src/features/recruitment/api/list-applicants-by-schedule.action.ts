"use server";

import "server-only";

import { z } from "zod";

import { requireAdmin } from "@/entities/identity/api/require-admin";
import { listApplicantsBySchedule } from "@/entities/schedule/api/list-applicants-by-schedule";
import type { ScheduleApplicant } from "@/entities/schedule/model/schedule-applicant";
import { ERROR_CODE, type ErrorCode } from "@/shared/config/error-codes.config";

const ListApplicantsByScheduleInputSchema = z.object({ scheduleId: z.string().uuid() });

export type ListApplicantsByScheduleActionInput = { scheduleId: string };

export type ListApplicantsByScheduleActionResult =
  { ok: true; applicants: ScheduleApplicant[] } | { ok: false; code: ErrorCode };

export async function listApplicantsByScheduleAction(
  input: ListApplicantsByScheduleActionInput,
): Promise<ListApplicantsByScheduleActionResult> {
  const requireResult = await requireAdmin();
  if (!requireResult.ok) {
    return { ok: false, code: requireResult.code };
  }

  const parsed = ListApplicantsByScheduleInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: ERROR_CODE.SCHEDULING_VALIDATION };
  }

  const result = await listApplicantsBySchedule({ scheduleId: parsed.data.scheduleId });
  if (!result.ok) {
    return { ok: false, code: result.code };
  }

  return { ok: true, applicants: result.data };
}
