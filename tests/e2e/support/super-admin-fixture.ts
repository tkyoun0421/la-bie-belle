import { randomUUID } from "node:crypto";

const ENV_KEY = "E2E_SUPER_ADMIN_EMAIL";

export const SUPER_ADMIN_FIXTURE_PASSWORD = "e2e-super-admin-password-Aa1!";

export function resolveSuperAdminFixtureEmail(): string {
  const existing = process.env[ENV_KEY];
  if (existing) {
    return existing;
  }

  const generated = `e2e-super-admin-${randomUUID()}@labiebelle.test`;
  process.env[ENV_KEY] = generated;
  return generated;
}
