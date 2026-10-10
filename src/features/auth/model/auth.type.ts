import type { RETRY_PATH } from "@/shared/consts/navigation.const";
import type { AuthDestination } from "@/entities/session/model/session.type";

export type EntryDecision = AuthDestination | typeof RETRY_PATH;
