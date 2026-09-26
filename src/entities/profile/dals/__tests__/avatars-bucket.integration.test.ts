import { randomUUID } from "node:crypto";
import { createSignedInUser } from "@tests/integration/supabase";

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
