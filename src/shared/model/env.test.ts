import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { parseClientEnv, parseServerEnv } from "./env";

const validServerSource = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key-fixture",
  SUPABASE_SERVICE_ROLE_KEY: "local-service-role-fixture",
  GOOGLE_OAUTH_CLIENT_ID: "test-client-id",
  GOOGLE_OAUTH_CLIENT_SECRET: "test-client-secret",
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: "test-vapid-public",
  VAPID_PRIVATE_KEY: "test-vapid-private",
  VAPID_SUBJECT: "mailto:admin@example.com",
  SUPER_ADMIN_EMAIL: "admin@example.com",
  QR_SIGNING_SECRET: "test-qr-secret",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};

const validClientSource = {
  NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key-fixture",
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: "test-vapid-public",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};

function loadEnvExample(): Record<string, string> {
  const content = readFileSync(resolve(import.meta.dirname, "../../../.env.example"), "utf8");
  const entries: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      continue;
    }
    const separatorIndex = trimmed.indexOf("=");
    entries[trimmed.slice(0, separatorIndex)] = trimmed.slice(separatorIndex + 1);
  }
  return entries;
}

const envExample = loadEnvExample();
const envExamplePlaceholderKeys = [
  "GOOGLE_OAUTH_CLIENT_ID",
  "GOOGLE_OAUTH_CLIENT_SECRET",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "SUPER_ADMIN_EMAIL",
  "QR_SIGNING_SECRET",
];

describe("parseServerEnv", () => {
  it("유효한 7범주 값을 그대로 파싱한다", () => {
    const result = parseServerEnv(validServerSource, { isProduction: false });
    expect(result).toEqual(validServerSource);
  });

  it("필수 키가 없으면 그 키 이름을 담아 실패한다", () => {
    const { GOOGLE_OAUTH_CLIENT_ID: _omit, ...source } = validServerSource;
    expect(() => parseServerEnv(source, { isProduction: false })).toThrowError(
      /GOOGLE_OAUTH_CLIENT_ID/,
    );
  });

  it("빈 문자열은 실패한다", () => {
    const source = { ...validServerSource, QR_SIGNING_SECRET: "" };
    expect(() => parseServerEnv(source, { isProduction: false })).toThrowError(/QR_SIGNING_SECRET/);
  });

  it("URL 형식이 아니면 실패한다", () => {
    const source = { ...validServerSource, NEXT_PUBLIC_APP_URL: "not-a-url" };
    expect(() => parseServerEnv(source, { isProduction: false })).toThrowError(
      /NEXT_PUBLIC_APP_URL/,
    );
  });

  it("이메일 형식이 아니면 실패한다", () => {
    const source = { ...validServerSource, SUPER_ADMIN_EMAIL: "not-an-email" };
    expect(() => parseServerEnv(source, { isProduction: false })).toThrowError(/SUPER_ADMIN_EMAIL/);
  });

  it("실패 메시지에 문제가 된 값 자체를 담지 않는다", () => {
    const source = { ...validServerSource, NEXT_PUBLIC_APP_URL: "not-a-url-leak-marker" };
    try {
      parseServerEnv(source, { isProduction: false });
      throw new Error("파싱이 실패해야 합니다");
    } catch (error) {
      expect((error as Error).message).not.toContain("not-a-url-leak-marker");
    }
  });

  it(".env.example 그대로는 dev에서 부팅된다(오탐 대조군)", () => {
    expect(() => parseServerEnv(envExample, { isProduction: false })).not.toThrow();
  });

  it(".env.example의 placeholder 전 항목이 production에서 거부된다", () => {
    expect(() => parseServerEnv(envExample, { isProduction: true })).toThrowError();
    try {
      parseServerEnv(envExample, { isProduction: true });
      throw new Error("파싱이 실패해야 합니다");
    } catch (error) {
      const message = (error as Error).message;
      for (const key of envExamplePlaceholderKeys) {
        expect(message).toContain(key);
      }
    }
  });

  it("production에서도 유효한 실값은 통과한다(오탐 대조군)", () => {
    const result = parseServerEnv(validServerSource, { isProduction: true });
    expect(result).toEqual(validServerSource);
  });
});

describe("parseClientEnv", () => {
  it("NEXT_PUBLIC_ 4종만 파싱한다", () => {
    const result = parseClientEnv(validClientSource, { isProduction: false });
    expect(result).toEqual(validClientSource);
  });

  it("필수 키가 없으면 그 키 이름을 담아 실패한다", () => {
    const { NEXT_PUBLIC_VAPID_PUBLIC_KEY: _omit, ...source } = validClientSource;
    expect(() => parseClientEnv(source, { isProduction: false })).toThrowError(
      /NEXT_PUBLIC_VAPID_PUBLIC_KEY/,
    );
  });

  it(".env.example의 NEXT_PUBLIC_VAPID_PUBLIC_KEY placeholder가 production에서 거부된다", () => {
    expect(() => parseClientEnv(envExample, { isProduction: true })).toThrowError(
      /NEXT_PUBLIC_VAPID_PUBLIC_KEY/,
    );
  });

  it(".env.example 그대로는 dev에서 부팅된다(오탐 대조군)", () => {
    expect(() => parseClientEnv(envExample, { isProduction: false })).not.toThrow();
  });
});
