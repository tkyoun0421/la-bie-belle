"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { readReplacementRequestById } from "#/entities/replacements/repositories/readReplacementRepository";
import { createReplacementApplication } from "#/entities/replacements/repositories/writeReplacementRepository";
import {
  replacementErrors,
  replacementErrorCodes,
} from "#/entities/replacements/models/errors/replacementError";
import {
  applyToReplacementInputSchema,
  type ApplyToReplacementInput,
} from "#/mutations/replacements/schemas/applyToReplacement";
import { requireAppActor } from "#/shared/lib/auth/appActor";
import { createSupabaseAdminClient } from "#/shared/lib/supabase/admin";
import type { Database } from "#/shared/types/database";

type ApplyToReplacementDependencies = {
  client?: SupabaseClient<Database>;
  readRequest?: typeof readReplacementRequestById;
  createApplication?: typeof createReplacementApplication;
  requireActor?: typeof requireAppActor;
};

export async function applyToReplacementAction(
  input: ApplyToReplacementInput,
  dependencies: ApplyToReplacementDependencies = {}
) {
  const values = applyToReplacementInputSchema.parse(input);
  const requireActor = dependencies.requireActor ?? requireAppActor;
  const actor = await requireActor();

  const client = dependencies.client ?? createSupabaseAdminClient();
  const readRequest = dependencies.readRequest ?? readReplacementRequestById;
  const createApplication = dependencies.createApplication ?? createReplacementApplication;

  const request = await readRequest(values.replacementRequestId, { client });

  if (!request) {
    throw replacementErrors.create(replacementErrorCodes.requestNotFound);
  }

  if (request.status !== "open") {
    throw replacementErrors.create(replacementErrorCodes.requestNotOpen);
  }

  if (request.cancelledUserId === actor.userId) {
    throw replacementErrors.create(replacementErrorCodes.cannotApplyToOwnCancellation);
  }

  // Check if user is qualified for the position
  const { data: qualification, error: qualificationError } = await client
    .from("member_positions")
    .select("status")
    .eq("user_id", actor.userId)
    .eq("position_id", request.positionId)
    .maybeSingle();

  if (qualificationError || !qualification) {
    throw replacementErrors.create(replacementErrorCodes.memberNotQualified);
  }

  const applicationId = await createApplication(
    {
      replacementRequestId: values.replacementRequestId,
      userId: actor.userId,
    },
    { client }
  );

  return {
    applicationId,
    replacementRequestId: values.replacementRequestId,
    userId: actor.userId,
  };
}
