import { execFileSync, spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { uploadAvatar } from "@/entities/profile/dals/upload-avatar";
import {
  createGuestClient,
  createSignedInUser,
} from "@tests/integration/supabase";

function dbContainerName(): string {
  const result = spawnSync(
    "docker",
    ["ps", "--filter", "name=supabase_db", "--format", "{{.Names}}"],
    { encoding: "utf8" },
  );
  const name = result.stdout.trim().split("\n")[0];
  if (!name) {
    throw new Error(
      "supabase_db 컨테이너를 못 찾았다. 로컬 Supabase가 떠 있는지 확인해라.",
    );
  }
  return name;
}

type BucketRow = {
  public: boolean;
  fileSizeLimit: number | null;
  allowedMimeTypes: string[];
};

function readAvatarsBucketRow(): BucketRow | null {
  const container = dbContainerName();

  const output = execFileSync(
    "docker",
    [
      "exec",
      "-i",
      container,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-t",
      "-A",
      "-F",
      "|",
      "-c",
      "select public, file_size_limit, array_to_string(allowed_mime_types, ',') from storage.buckets where id = 'avatars';",
    ],
    { encoding: "utf8" },
  );

  const line = output.trim();
  if (!line) {
    return null;
  }

  const [publicRaw, limitRaw, mimeRaw] = line.split("|");
  return {
    public: publicRaw === "t",
    fileSizeLimit: limitRaw ? Number(limitRaw) : null,
    allowedMimeTypes: mimeRaw ? mimeRaw.split(",") : [],
  };
}

function fakeWebpBlob(): Blob {
  const bytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0]);
  return new Blob([bytes], { type: "image/webp" });
}

describe("avatars 버킷 설정", () => {
  it("public·file_size_limit·allowed_mime_types가 문서대로다", () => {
    const bucket = readAvatarsBucketRow();

    expect(bucket).toEqual({
      public: true,
      fileSizeLimit: 1048576,
      allowedMimeTypes: ["image/webp"],
    });
  });
});

describe("uploadAvatar", () => {
  it("자기 폴더에 올리면 공개 URL을 돌려주고 그 URL이 200으로 읽힌다", async () => {
    const user = await createSignedInUser();

    const url = await uploadAvatar(user.client, user.userId, fakeWebpBlob());

    expect(url).toMatch(
      new RegExp(
        `/storage/v1/object/public/avatars/${user.userId}/[0-9a-f-]{36}\\.webp$`,
      ),
    );

    const response = await fetch(url);
    expect(response.status).toBe(200);
  });

  it("남의 폴더에 올리는 raw 요청은 정책에 걸려 거부된다", async () => {
    const owner = await createSignedInUser();
    const intruder = await createSignedInUser();

    const { error } = await intruder.client.storage
      .from("avatars")
      .upload(`${owner.userId}/x.webp`, fakeWebpBlob());

    expect(error).not.toBeNull();
  });

  it("로그아웃 상태의 raw 요청은 거부된다", async () => {
    const guest = createGuestClient();

    const { error } = await guest.storage
      .from("avatars")
      .upload("guest/x.webp", fakeWebpBlob());

    expect(error).not.toBeNull();
  });
});
