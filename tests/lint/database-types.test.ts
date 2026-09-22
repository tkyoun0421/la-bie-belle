import {
  ALIAS_FILE,
  bareClientFiles,
  describeDatabaseTypesViolation,
  generatedObjects,
  migrationObjects,
  missingObjects,
  repositoryDatabaseTypesViolations,
  TYPES_FILE,
} from "@tests/lint/database-types";

describe("마이그레이션에서 표·뷰·함수 이름을 뽑는다", () => {
  it("스키마와 갈래를 붙여 낸다", () => {
    const sql = `
create table public.days (
  id uuid primary key
);

create view public.open_slots as
  select 1;

create function public.open_day(p_work_date date)
  returns void
as $$ begin end; $$;
`;

    expect(migrationObjects(sql)).toEqual([
      { schema: "public", kind: "table", name: "days" },
      { schema: "public", kind: "view", name: "open_slots" },
      { schema: "public", kind: "function", name: "open_day" },
    ]);
  });

  it("`create or replace function`도 같은 함수로 센다", () => {
    const sql = `
create function public.submit_profile(phone text) returns void as $$ begin end; $$;
create or replace function public.submit_profile(phone text) returns void as $$ begin end; $$;
`;

    expect(migrationObjects(sql)).toEqual([
      { schema: "public", kind: "function", name: "submit_profile" },
    ]);
  });

  it("`internal` 스키마도 든다", () => {
    const sql = `create function internal.check_in(p_day_id uuid) returns void as $$ begin end; $$;`;

    expect(migrationObjects(sql)).toEqual([
      { schema: "internal", kind: "function", name: "check_in" },
    ]);
  });

  /** 주석 안의 DDL을 세면 영영 안 사라지는 위반이 생긴다. */
  it("주석 줄은 안 센다", () => {
    const sql = `-- create table public.dropped (id uuid);`;

    expect(migrationObjects(sql)).toEqual([]);
  });
});

describe("생성된 타입에서 표·뷰·함수 이름을 뽑는다", () => {
  const types = `
export type Database = {
  internal: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_in: { Args: { p_day_id: string }; Returns: undefined };
    };
  };
  public: {
    Tables: {
      days: {
        Row: {
          id: string;
        };
      };
    };
    Views: {
      open_slots: {
        Row: {
          id: string | null;
        };
      };
    };
    Functions: {
      open_day: { Args: { p_work_date: string }; Returns: undefined };
    };
  };
};
`;

  it("스키마마다 갈래를 갈라 낸다", () => {
    expect(generatedObjects(types)).toEqual([
      { schema: "internal", kind: "function", name: "check_in" },
      { schema: "public", kind: "table", name: "days" },
      { schema: "public", kind: "view", name: "open_slots" },
      { schema: "public", kind: "function", name: "open_day" },
    ]);
  });

  /** 빈 칸은 이름이 아니다. */
  it("`[_ in never]: never`를 이름으로 안 읽는다", () => {
    expect(generatedObjects(types).map(({ name }) => name)).not.toContain("_");
  });

  it("`Row` 안의 열 이름을 표 이름으로 안 읽는다", () => {
    expect(generatedObjects(types).filter(({ name }) => name === "id")).toEqual(
      [],
    );
  });
});

describe("마이그레이션에 있는데 생성 타입에 없는 것", () => {
  const sql = `
create table public.days (id uuid);
create table public.slots (id uuid);
`;
  const types = `
export type Database = {
  public: {
    Tables: {
      days: {
        Row: {
          id: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
};
`;

  it("빠진 것을 낸다", () => {
    expect(missingObjects(sql, types)).toEqual([
      { schema: "public", kind: "table", name: "slots" },
    ]);
  });

  it("둘이 같으면 아무것도 안 낸다", () => {
    expect(
      missingObjects(`create table public.days (id uuid);`, types),
    ).toEqual([]);
  });
});

describe("생성 타입을 안 물린 클라이언트를 쓰는 파일", () => {
  it("`@supabase/supabase-js`에서 `SupabaseClient`를 가져오는 파일을 잡는다", () => {
    const files = [
      {
        file: "src/entities/profile/dals/ensureProfile.ts",
        source: `import type { SupabaseClient } from "@supabase/supabase-js";`,
      },
      {
        file: "src/entities/profile/dals/getMyProfile.ts",
        source: `import type { Db } from "@/shared/api/database";`,
      },
    ];

    expect(bareClientFiles(files)).toEqual([
      "src/entities/profile/dals/ensureProfile.ts",
    ]);
  });

  it("한 줄에 여러 이름을 가져와도 잡는다", () => {
    const files = [
      {
        file: "src/shared/lib/getCurrentUser.ts",
        source: `import type { SupabaseClient, User } from "@supabase/supabase-js";`,
      },
    ];

    expect(bareClientFiles(files)).toEqual([
      "src/shared/lib/getCurrentUser.ts",
    ]);
  });

  /** 별명을 내놓는 파일 자신은 그 이름을 써야 한다. */
  it(`${ALIAS_FILE}는 예외다`, () => {
    const files = [
      {
        file: ALIAS_FILE,
        source: `import type { SupabaseClient } from "@supabase/supabase-js";`,
      },
    ];

    expect(bareClientFiles(files)).toEqual([]);
  });

  it("`User`만 가져오는 파일은 안 잡는다", () => {
    const files = [
      {
        file: "src/shared/lib/getCurrentUser.ts",
        source: `import type { User } from "@supabase/supabase-js";`,
      },
    ];

    expect(bareClientFiles(files)).toEqual([]);
  });
});

describe("위반을 사람이 읽는 문장으로 옮긴다", () => {
  it("빠진 것은 `pnpm types`를 가리킨다", () => {
    const message = describeDatabaseTypesViolation({
      type: "missing-object",
      object: { schema: "public", kind: "table", name: "slots" },
    });

    expect(message).toContain("public.slots");
    expect(message).toContain("pnpm types");
  });

  it("생성 타입을 안 물린 클라이언트는 별명을 가리킨다", () => {
    const message = describeDatabaseTypesViolation({
      type: "bare-client",
      file: "src/entities/profile/dals/ensureProfile.ts",
    });

    expect(message).toContain("src/entities/profile/dals/ensureProfile.ts");
    expect(message).toContain("Db");
  });
});

/**
 * 표를 하나 더하고 `pnpm types`를 안 돌리면 여기가 빨개진다 — DB 없이 무는 검사다.
 * 로컬 DB에 붙어 diff가 0인지 보는 것은 CI가 따로 한다.
 */
describe("저장소 실물 — 마이그레이션과 생성 타입이 맞고 맨 클라이언트가 없다", () => {
  it("위반이 없다", () => {
    expect(
      repositoryDatabaseTypesViolations().map(describeDatabaseTypesViolation),
    ).toEqual([]);
  });

  it("생성 타입 파일과 별명 파일의 자리가 정해져 있다", () => {
    expect(TYPES_FILE).toBe("src/shared/api/database-types.ts");
    expect(ALIAS_FILE).toBe("src/shared/api/database.ts");
  });
});
