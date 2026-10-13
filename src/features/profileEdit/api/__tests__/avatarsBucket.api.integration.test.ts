import { randomUUID } from "node:crypto";
import { jest } from "@jest/globals";
import { createSignedInUser } from "@tests/integration/supabase";

jest.unstable_mockModule("react-native-get-random-values", () => ({}));

const { uploadAvatar } =
  await import("@/features/profileEdit/api/avatarsBucket.api");

describe("avatars 버킷", () => {
  it("본인 user_id 폴더에 쓰면 성공한다", async () => {
    const user = await createSignedInUser();
    const path = `${user.userId}/${randomUUID()}.webp`;

    const { error } = await user.client.storage
      .from("avatars")
      .upload(path, Buffer.from("가짜 사진 데이터"), {
        contentType: "image/webp",
      });

    expect(error).toBeNull();
  });

  it("남의 user_id 폴더에 쓰면 거부된다", async () => {
    const owner = await createSignedInUser();
    const intruder = await createSignedInUser();
    const path = `${owner.userId}/${randomUUID()}.webp`;

    const { error } = await intruder.client.storage
      .from("avatars")
      .upload(path, Buffer.from("가짜 사진 데이터"), {
        contentType: "image/webp",
      });

    expect(error).not.toBeNull();
  });

  it("1MB를 넘는 파일은 거부된다", async () => {
    const user = await createSignedInUser();
    const path = `${user.userId}/${randomUUID()}.webp`;
    const overLimit = Buffer.alloc(1024 * 1024 + 1, 1);

    const { error } = await user.client.storage
      .from("avatars")
      .upload(path, overLimit, { contentType: "image/webp" });

    expect(error).not.toBeNull();
  });

  it("올린 사진은 인증 없이도 공개 URL로 읽힌다", async () => {
    const user = await createSignedInUser();
    const path = `${user.userId}/${randomUUID()}.webp`;
    const content = Buffer.from("가짜 사진 데이터");

    const { error: uploadError } = await user.client.storage
      .from("avatars")
      .upload(path, content, { contentType: "image/webp" });
    expect(uploadError).toBeNull();

    const {
      data: { publicUrl },
    } = user.client.storage.from("avatars").getPublicUrl(path);

    const response = await fetch(publicUrl);

    expect(response.status).toBe(200);
  });
});

describe("uploadAvatar — 사진을 본인 폴더에 올리고 공개 주소를 돌려준다", () => {
  const PIXEL_URI = "data:image/webp;base64,AAEC";

  it("본인 user_id 폴더 아래 확장자를 붙인 공개 주소를 돌려준다", async () => {
    const user = await createSignedInUser();

    const publicUrl = await uploadAvatar(user.client, {
      userId: user.userId,
      uri: PIXEL_URI,
      contentType: "image/webp",
      extension: "webp",
    });

    expect(publicUrl).toContain(`/avatars/${user.userId}/`);
    expect(publicUrl.endsWith(".webp")).toBe(true);
  });

  it("돌려준 주소에서 올린 바이트가 그대로 읽힌다", async () => {
    const user = await createSignedInUser();

    const publicUrl = await uploadAvatar(user.client, {
      userId: user.userId,
      uri: PIXEL_URI,
      contentType: "image/webp",
      extension: "webp",
    });
    const response = await fetch(publicUrl);

    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([0, 1, 2]),
    );
  });

  it("같은 사진을 두 번 올려도 이름이 겹치지 않는다", async () => {
    const user = await createSignedInUser();
    const input = {
      userId: user.userId,
      uri: PIXEL_URI,
      contentType: "image/webp",
      extension: "webp",
    };

    const first = await uploadAvatar(user.client, input);
    const second = await uploadAvatar(user.client, input);

    expect(first).not.toBe(second);
  });

  it("남의 폴더에는 올리지 못하고 던진다", async () => {
    const owner = await createSignedInUser();
    const intruder = await createSignedInUser();

    await expect(
      uploadAvatar(intruder.client, {
        userId: owner.userId,
        uri: PIXEL_URI,
        contentType: "image/webp",
        extension: "webp",
      }),
    ).rejects.toBeDefined();
  });
});
