import type { SupabaseClient } from "@supabase/supabase-js";
import {
  eventTemplateErrors,
  eventTemplateErrorCodes,
} from "#/entities/events/models/errors/eventTemplateError";
import type { Database } from "#/shared/types/database";

type EventTemplateRepositoryOptions = {
  client: SupabaseClient<Database>;
};

type EventTemplateSlotWriteRecord = {
  positionId: string;
  requiredCount: number;
  trainingCount: number;
};

export type CreateEventTemplateRecordInput = {
  createdBy: string | null;
  firstServiceAt: string;
  isPrimary: boolean;
  lastServiceEndAt: string;
  name: string;
  slotDefaults: EventTemplateSlotWriteRecord[];
};

export type UpdateEventTemplateRecordInput = {
  firstServiceAt: string;
  id: string;
  isPrimary: boolean;
  lastServiceEndAt: string;
  name: string;
  slotDefaults: EventTemplateSlotWriteRecord[];
};

export type EventTemplateDeleteSnapshot = {
  id: string;
  isPrimary: boolean;
};

export async function createEventTemplateRecord(
  input: CreateEventTemplateRecordInput,
  options: EventTemplateRepositoryOptions
) {
  const { client } = options;
  const { data, error } = await client.rpc("create_event_template", {
    p_name: input.name,
    p_is_primary: input.isPrimary,
    p_first_service_at: input.firstServiceAt,
    p_last_service_end_at: input.lastServiceEndAt,
    p_slot_defaults: input.slotDefaults.map((slot) => ({
      position_id: slot.positionId,
      required_count: slot.requiredCount,
      training_count: slot.trainingCount,
    })),
    p_created_by: input.createdBy ?? undefined,
  });

  if (error) {
    throw eventTemplateErrors.create(eventTemplateErrorCodes.createFailed, {
      cause: error,
    });
  }

  if (!data || typeof data !== "string") {
    throw eventTemplateErrors.create(
      eventTemplateErrorCodes.createResultMissing
    );
  }

  return data;
}

export async function updateEventTemplateRecord(
  input: UpdateEventTemplateRecordInput,
  options: EventTemplateRepositoryOptions
) {
  const { client } = options;
  const { data, error } = await client.rpc("update_event_template", {
    p_template_id: input.id,
    p_name: input.name,
    p_is_primary: input.isPrimary,
    p_first_service_at: input.firstServiceAt,
    p_last_service_end_at: input.lastServiceEndAt,
    p_slot_defaults: input.slotDefaults.map((slot) => ({
      position_id: slot.positionId,
      required_count: slot.requiredCount,
      training_count: slot.trainingCount,
    })),
  });

  if (error) {
    if ("code" in error && error.code === "P0002") {
      throw eventTemplateErrors.create(
        eventTemplateErrorCodes.updateTargetNotFound,
        {
          cause: error,
        }
      );
    }

    throw eventTemplateErrors.create(eventTemplateErrorCodes.updateFailed, {
      cause: error,
    });
  }

  if (!data || typeof data !== "string") {
    throw eventTemplateErrors.create(
      eventTemplateErrorCodes.updateResultMissing
    );
  }

  return data;
}

export async function readEventTemplateDeleteSnapshot(
  templateId: string,
  options: EventTemplateRepositoryOptions
): Promise<EventTemplateDeleteSnapshot | null> {
  const { client } = options;
  const { data, error } = await client
    .from("event_templates")
    .select("id, is_primary")
    .eq("id", templateId)
    .maybeSingle();

  if (error) {
    throw eventTemplateErrors.create(
      eventTemplateErrorCodes.deleteTargetNotFound,
      {
        cause: error,
      }
    );
  }

  if (!data?.id) {
    return null;
  }

  return {
    id: data.id,
    isPrimary: data.is_primary,
  };
}

export async function countEventTemplateRecords(
  options: EventTemplateRepositoryOptions
) {
  const { client } = options;
  const { count, error } = await client
    .from("event_templates")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw eventTemplateErrors.create(eventTemplateErrorCodes.countFailed, {
      cause: error,
    });
  }

  return count ?? 0;
}

export async function deleteEventTemplateRecord(
  templateId: string,
  options: EventTemplateRepositoryOptions
) {
  const { client } = options;
  const { error } = await client
    .from("event_templates")
    .delete()
    .eq("id", templateId);

  if (error) {
    throw eventTemplateErrors.create(eventTemplateErrorCodes.deleteFailed, {
      cause: error,
    });
  }
}
