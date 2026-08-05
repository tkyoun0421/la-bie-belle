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

  it("dev에서는 changeme placeholder로 부팅된다(오탐 대조군)", () => {
    const source = { ...validServerSource, SUPABASE_SERVICE_ROLE_KEY: "CHANGE_ME_SERVICE_ROLE" };
    expect(() => parseServerEnv(source, { isProduction: false })).not.toThrow();
  });

  it("production에서는 changeme placeholder(대소문자 무시)를 거부한다", () => {
    const source = { ...validServerSource, SUPABASE_SERVICE_ROLE_KEY: "ChangeMe_ServiceRole" };
    expect(() => parseServerEnv(source, { isProduction: true })).toThrowError(
      /SUPABASE_SERVICE_ROLE_KEY/,
    );
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

  it("production에서는 changeme placeholder를 거부한다", () => {
    const source = { ...validClientSource, NEXT_PUBLIC_VAPID_PUBLIC_KEY: "changeme_vapid" };
    expect(() => parseClientEnv(source, { isProduction: true })).toThrowError(
      /NEXT_PUBLIC_VAPID_PUBLIC_KEY/,
    );
  });
});
