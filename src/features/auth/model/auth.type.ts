import type { AuthDestination } from "@/entities/session/model/session.type";

export type EntryDecision = AuthDestination | "/retry";
