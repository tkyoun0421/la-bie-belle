import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import type { BrowserContext, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import {
  loadSupabaseTestEnv,
  signInWithPasswordCookies,
  toPlaywrightCookies,
} from "./support/supabase-test-auth";

type ProfileFixture = {
  name: string;
  phone: string;
  gender: "male" | "female";
  birth_date: string;
  status?: "pending" | "active";
};

function randomPhone(): string {
  const suffix = Math.floor(Math.random() * 1e8)
    .toString()
    .padStart(8, "0");
  return `010${suffix}`;
}

async function createSessionedUser(
  context: BrowserContext,
  baseURL: string | undefined,
  emailPrefix: string,
  profile?: ProfileFixture,
) {
  const env = loadSupabaseTestEnv();
  const admin = createClient(env.supabaseUrl, env.serviceRoleKey);
  const email = `${emailPrefix}-${randomUUID()}@labiebelle.test`;
  const password = "e2e-signup-password-Aa1!";

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw error ?? new Error("테스트 사용자 생성에 실패했습니다.");
  }

  if (profile) {
    const { error: profileError } = await admin
      .from("profiles")
      .insert({ id: data.user.id, ...profile });
    if (profileError) {
      throw profileError;
    }
  }

  const cookies = await signInWithPasswordCookies(env, { email, password });
  const domain = new URL(baseURL ?? "http://localhost:3100").hostname;
  await context.clearCookies();
  await context.addCookies(toPlaywrightCookies(cookies, domain));

  return data.user.id;
}

async function submitSignupForm(page: Page, phone: string = randomPhone()) {
  await page.getByLabel("이름").fill("홍길동");
  await page.getByLabel("휴대폰 번호").fill(phone);
  await page.getByRole("button", { name: /성별/ }).click();
  await page.getByRole("option", { name: "남성" }).click();
  await page.getByLabel("생년월일").fill("1990-01-01");
  await page.getByRole("button", { name: "가입 신청하기" }).click();
}

test.describe("가입과 승인 대기", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("무프로필 사용자가 가입 폼을 제출하면 pending 프로필이 생기고 /pending으로 이동한다", async ({
    page,
    context,
    baseURL,
  }) => {
    await createSessionedUser(context, baseURL, "e2e-signup-new");

    await page.goto("/onboarding");
    await submitSignupForm(page);

    await expect(page).toHaveURL(/\/pending$/);
    await expect(page.getByRole("heading")).toHaveText("승인을 기다리고 있어요");
  });

  test("pending 사용자의 보호 탭 접근이 /pending으로 리다이렉트된다", async ({
    page,
    context,
    baseURL,
  }) => {
    await createSessionedUser(context, baseURL, "e2e-signup-pending", {
      name: "박민수",
      phone: randomPhone(),
      gender: "male",
      birth_date: "1990-01-01",
    });

    await page.goto("/schedule");

    await expect(page).toHaveURL(/\/pending$/);
  });

  test("pending 사용자가 (tabs) 밖의 보호 라우트(/schedule/<id>)에 접근해도 /pending으로 리다이렉트된다", async ({
    page,
    context,
    baseURL,
  }) => {
    await createSessionedUser(context, baseURL, "e2e-signup-pending-detail", {
      name: "이수진",
      phone: randomPhone(),
      gender: "female",
      birth_date: "1990-01-01",
    });

    await page.goto("/schedule/e2e-test-id");

    await expect(page).toHaveURL(/\/pending$/);
  });

  test("pending 사용자가 /onboarding에 접근해도 /pending으로 리다이렉트된다", async ({
    page,
    context,
    baseURL,
  }) => {
    await createSessionedUser(context, baseURL, "e2e-signup-pending-onboarding", {
      name: "최우진",
      phone: randomPhone(),
      gender: "male",
      birth_date: "1990-01-01",
    });

    await page.goto("/onboarding");

    await expect(page).toHaveURL(/\/pending$/);
  });

  test("active 사용자가 /pending에 접근하면 홈으로 리다이렉트된다", async ({
    page,
    context,
    baseURL,
  }) => {
    await createSessionedUser(context, baseURL, "e2e-signup-active-pending", {
      name: "정하늘",
      phone: randomPhone(),
      gender: "female",
      birth_date: "1990-01-01",
      status: "active",
    });

    await page.goto("/pending");

    await expect(page).toHaveURL(baseURL ? `${baseURL}/` : "http://localhost:3100/");
  });

  test("이미 프로필이 있는 사용자는 /onboarding에서 폼을 다시 보거나 재제출할 수 없다", async ({
    page,
    context,
    baseURL,
  }) => {
    await createSessionedUser(context, baseURL, "e2e-signup-active", {
      name: "김영희",
      phone: randomPhone(),
      gender: "female",
      birth_date: "1990-01-01",
      status: "active",
    });

    await page.goto("/onboarding");

    await expect(page).toHaveURL(baseURL ? `${baseURL}/` : "http://localhost:3100/");
    await expect(page.getByLabel("이름")).not.toBeVisible();
  });

  test("이미 프로필이 있는 사용자로 세션이 바뀐 채 같은 가입 폼을 제출하면 Server Action이 직접 거부한다", async ({
    page,
    context,
    baseURL,
  }) => {
    await createSessionedUser(context, baseURL, "e2e-signup-resubmit-a");
    await page.goto("/onboarding");
    await expect(page.getByLabel("이름")).toBeVisible();

    await createSessionedUser(context, baseURL, "e2e-signup-resubmit-b", {
      name: "이미가입",
      phone: randomPhone(),
      gender: "male",
      birth_date: "1990-01-01",
      status: "active",
    });

    await submitSignupForm(page);

    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByText("이미 가입 절차를 진행했어요")).toBeVisible();
  });

  test("이미 사용 중인 휴대폰 번호로 제출하면 전용 안내가 보인다", async ({
    page,
    context,
    baseURL,
  }) => {
    const takenPhone = randomPhone();
    await createSessionedUser(context, baseURL, "e2e-signup-phone-taken-owner", {
      name: "선점자",
      phone: takenPhone,
      gender: "male",
      birth_date: "1990-01-01",
      status: "active",
    });

    await createSessionedUser(context, baseURL, "e2e-signup-phone-taken-challenger");
    await page.goto("/onboarding");
    await submitSignupForm(page, takenPhone);

    await expect(page.getByText("이미 가입된 휴대폰 번호예요")).toBeVisible();
    await expect(page).toHaveURL(/\/onboarding$/);
  });
});
