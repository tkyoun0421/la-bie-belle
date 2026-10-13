import { DomainError } from "@/shared/model/errors";

export function isNoDefaultWage(error: Error | null): boolean {
  return error instanceof DomainError && error.code === "no_default_wage";
}
