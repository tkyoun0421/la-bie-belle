import path from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { seedSessionForUser } from "@tests/e2e/support/session";
import { createRejectedUser } from "@tests/integration/postgres";
import { createSignedInUser } from "@tests/integration/supabase";

function genderOption(page: Page, label: "여" | "남", selected: boolean) {
  return page
    .getByRole("radio", { name: label, checked: selected })
    .or(
      page.getByRole("button", { name: label, exact: true, pressed: selected }),
    );
}

async function fillNewProfileForm(page: Page, name: string): Promise<Locator> {
  await page.getByPlaceholder("근무표에 뜰 이름").fill(name);
  await page.getByRole("button", { name: "여", exact: true }).click();
  await page.getByPlaceholder("19930421").fill("19930421");
  const phoneInput = page.getByPlaceholder("010-0000-0000");
  await phoneInput.fill("01000000002");
  return phoneInput;
}

test("새 사용자가 프로필을 보내면 승인 대기로 바뀐다", async ({
  page,
  context,
  baseURL,
}) => {
  const user = await createSignedInUser();
  await seedSessionForUser(context, baseURL ?? "http://localhost:3000", user);

  await page.goto("/pending");

  await expect(page.getByText("프로필", { exact: true })).toBeVisible();
  await expect(
    page.getByText("관리자가 누구인지 알아볼 수 있게 적어 주세요"),
  ).toBeVisible();

  const submitButton = page.getByRole("button", { name: "보내기" });
  await expect(submitButton).toBeDisabled();
  await expect(
    page.getByText("빈 칸을 다 채우면 보낼 수 있어요"),
  ).toBeVisible();

  const phoneInput = await fillNewProfileForm(page, "새로 온 사람");
  await expect(phoneInput).toHaveValue("010-0000-0002");

  await expect(
    page.getByText("빈 칸을 다 채우면 보낼 수 있어요"),
  ).not.toBeVisible();
  await expect(submitButton).toBeEnabled();

  await submitButton.click();

  const confirmSheet = page.getByRole("dialog");
  await expect(confirmSheet.getByText("이대로 보낼까요")).toBeVisible();
  await expect(confirmSheet.getByText("새로 온 사람")).toBeVisible();
  await expect(confirmSheet.getByText("여", { exact: true })).toBeVisible();
  await expect(confirmSheet.getByText("1993.04.21")).toBeVisible();
  await expect(
    confirmSheet.getByText("이름과 성별과 생년월일은 보내고 나면 못 고쳐요"),
  ).toBeVisible();

  await confirmSheet.getByRole("button", { name: "보낼게요" }).click();

  await expect(page.getByText("승인 기다리는 중")).toBeVisible();
  await expect(page.getByText("관리자가 확인 중이에요")).toBeVisible();

  const { data: profile, error: profileError } = await user.client
    .from("profiles")
    .select("submitted_at")
    .eq("user_id", user.userId)
    .single<{ submitted_at: string | null }>();
  expect(profileError).toBeNull();
  expect(profile?.submitted_at).not.toBeNull();

  const { data: privateRow, error: privateError } = await user.client
    .from("profile_private")
    .select("phone, birth_date, gender")
    .eq("profile_id", user.profileId)
    .single<{ phone: string; birth_date: string; gender: string }>();
  expect(privateError).toBeNull();
  expect(privateRow?.phone).toBe("010-0000-0002");
  expect(privateRow?.gender).toBe("female");
  expect(privateRow?.birth_date).toBe("1993-04-21");
});

test("고칠게요는 시트만 닫는다", async ({ page, context, baseURL }) => {
  const user = await createSignedInUser();
  await seedSessionForUser(context, baseURL ?? "http://localhost:3000", user);

  await page.goto("/pending");

  const phoneInput = await fillNewProfileForm(page, "새로 온 사람");
  await expect(phoneInput).toHaveValue("010-0000-0002");

  await page.getByRole("button", { name: "보내기" }).click();

  const confirmSheet = page.getByRole("dialog");
  await expect(confirmSheet.getByText("이대로 보낼까요")).toBeVisible();

  await confirmSheet.getByRole("button", { name: "고칠게요" }).click();

  await expect(confirmSheet).not.toBeVisible();
  await expect(page.getByPlaceholder("근무표에 뜰 이름")).toHaveValue(
    "새로 온 사람",
  );
  await expect(page.getByPlaceholder("19930421")).toHaveValue("19930421");
  await expect(phoneInput).toHaveValue("010-0000-0002");
});

test("거절된 사용자는 거절된 뒤 화면을 보고 다시 보내기로 지난 값이 든 폼을 연다", async ({
  page,
  context,
  baseURL,
}) => {
  const user = await createRejectedUser();
  await seedSessionForUser(context, baseURL ?? "http://localhost:3000", user);

  await page.goto("/pending");

  await expect(page.getByText("아직 연결 전")).toBeVisible();
  await expect(page.getByText("이번엔 연결이 안 됐어요")).toBeVisible();
  await expect(
    page.getByText("프로필을 고쳐서 다시 보낼 수 있어요"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 보내기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible();
  await expect(page.getByRole("button", { name: "알림 켜기" })).toHaveCount(0);

  await page.getByRole("button", { name: "다시 보내기" }).click();

  const nameInput = page.getByPlaceholder("근무표에 뜰 이름");
  await expect(nameInput).toHaveValue("테스트 이름");
  await expect(page.getByPlaceholder("19930421")).toHaveValue("19930421");
  await expect(page.getByPlaceholder("010-0000-0000")).toHaveValue(
    "010-0000-0001",
  );
  await expect(genderOption(page, "여", true)).toBeVisible();

  await nameInput.fill("고친 이름");

  const submitButton = page.getByRole("button", { name: "보내기" });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();

  const confirmSheet = page.getByRole("dialog");
  await expect(confirmSheet.getByText("이대로 보낼까요")).toBeVisible();
  await confirmSheet.getByRole("button", { name: "보낼게요" }).click();

  await expect(page.getByText("승인 기다리는 중")).toBeVisible();
  await expect(page.getByText("관리자가 확인 중이에요")).toBeVisible();
});

test("사진을 바꾸면 원 안 사진이 바뀐다", async ({
  page,
  context,
  baseURL,
}) => {
  const user = await createSignedInUser();
  await seedSessionForUser(context, baseURL ?? "http://localhost:3000", user);

  await page.goto("/pending");

  const photoButton = page.getByRole("button", { name: "사진 바꾸기" });
  const photo = photoButton.locator("img");

  await page
    .locator("input[type=file]")
    .setInputFiles(path.join(process.cwd(), "tests/e2e/fixtures/avatar.png"));

  await expect(photo).toHaveAttribute(
    "src",
    /\/storage\/v1\/object\/public\/avatars\//,
  );

  const src = await photo.getAttribute("src");

  const { data, error } = await user.client
    .from("profiles")
    .select("photo_url")
    .eq("user_id", user.userId)
    .single<{ photo_url: string | null }>();

  expect(error).toBeNull();
  expect(data?.photo_url).toBe(src);
});
