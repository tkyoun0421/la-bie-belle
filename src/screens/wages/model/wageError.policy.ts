import { DomainError } from "@/shared/model/error.type";

export function isNoDefaultWage(error: Error | null): boolean {
  return error instanceof DomainError && error.code === "no_default_wage";
}
