import { errorsOf, violationsOf } from "@tests/lint/ruleCheck";

const DUMB_UI = "house/dumb-ui";

const DUMB_COMPONENT = `import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { cn } from "@/shared/utils/cn";

export function Counter({ label, onDone }: { label: string; onDone: () => void }) {
  const [count, setCount] = useState(0);

  return (
    <View className={cn("gap-2 px-4", count > 0 && "items-center")}>
      <Text className="px-1">{label}</Text>
      <Pressable hitSlop={12} onPress={() => setCount(count + 1)}>
        <Text className="px-2">{count}</Text>
      </Pressable>
      <Pressable onPress={onDone}>
        <Text className="px-2">닫기</Text>
      </Pressable>
    </View>
  );
}
`;

describe("규칙9 — .tsx는 더미 UI", () => {
  it(".tsx에서 @supabase/supabase-js를 import하면 걸린다", async () => {
    const code = `import { createClient } from "@supabase/supabase-js";\n\nexport function Fixture() {\n  createClient("url", "key");\n  return null;\n}\n`;

    const violations = await violationsOf(
      code,
      "src/screens/home/ui/fixture.tsx",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(DUMB_UI);
  });

  it(".tsx에서 fetch(...)를 호출하면 걸린다", async () => {
    const code = `export function Fixture() {\n  fetch("/api/profile");\n  return null;\n}\n`;

    const violations = await violationsOf(
      code,
      "src/screens/home/ui/fixture.tsx",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(DUMB_UI);
  });

  it(".tsx에서 useQuery를 호출하면 걸린다", async () => {
    const code = `import { useQuery } from "@tanstack/react-query";\n\nexport function Fixture() {\n  useQuery({ queryKey: ["x"], queryFn: async () => null });\n  return null;\n}\n`;

    const violations = await violationsOf(
      code,
      "src/screens/home/ui/fixture.tsx",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(DUMB_UI);
  });

  it(".tsx에서 useMutation을 호출하면 걸린다", async () => {
    const code = `import { useMutation } from "@tanstack/react-query";\n\nexport function Fixture() {\n  useMutation({ mutationFn: async () => null });\n  return null;\n}\n`;

    const violations = await violationsOf(
      code,
      "src/screens/home/ui/fixture.tsx",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(DUMB_UI);
  });

  it(".tsx에서 useSuspenseQuery를 호출하면 걸린다", async () => {
    const code = `import { useSuspenseQuery } from "@tanstack/react-query";\n\nexport function Fixture() {\n  useSuspenseQuery({ queryKey: ["x"], queryFn: async () => null });\n  return null;\n}\n`;

    const violations = await violationsOf(
      code,
      "src/screens/home/ui/fixture.tsx",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(DUMB_UI);
  });

  it("alias로 이름을 바꿔 useQuery를 불러도 걸린다", async () => {
    const code = `import { useQuery as useProfileQuery } from "@tanstack/react-query";\n\nexport function Fixture() {\n  useProfileQuery({ queryKey: ["x"], queryFn: async () => null });\n  return null;\n}\n`;

    const violations = await violationsOf(
      code,
      "src/screens/home/ui/fixture.tsx",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(DUMB_UI);
  });

  it(".ts 파일의 @supabase/supabase-js import는 통과한다", async () => {
    const code = `import { createClient } from "@supabase/supabase-js";\n\nexport function load() {\n  return createClient("url", "key");\n}\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/api/fixture.api.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      DUMB_UI,
    );
  });

  it(".ts 파일의 fetch(...) 호출은 통과한다", async () => {
    const code = `export function load() {\n  return fetch("/api/profile");\n}\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/api/fixture.api.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      DUMB_UI,
    );
  });

  it(".ts 파일의 useQuery 호출은 통과한다", async () => {
    const code = `import { useQuery } from "@tanstack/react-query";\n\nexport function useLoad() {\n  return useQuery({ queryKey: ["x"], queryFn: async () => null });\n}\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/api/fixture.api.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      DUMB_UI,
    );
  });

  it("src/shared/ui/의 fetch(...) 호출은 예외가 아니라 걸린다", async () => {
    const code = `export function Fixture() {\n  fetch("/api/profile");\n  return null;\n}\n`;

    const violations = await violationsOf(code, "src/shared/ui/fixture.tsx");

    expect(violations.map((violation) => violation.ruleId)).toContain(DUMB_UI);
  });

  it("이름으로 면제받는 `.tsx` 경로가 없다", async () => {
    const code = `import { createClient } from "@supabase/supabase-js";\n\nexport function Providers() {\n  createClient("url", "key");\n  return null;\n}\n`;

    const violations = await violationsOf(code, "src/app/providers.tsx");

    expect(violations.map((violation) => violation.ruleId)).toContain(DUMB_UI);
  });

  it("controller를 당긴 .tsx가 useState를 들면 걸린다", async () => {
    const code = `import { useState } from "react";\nimport { useFixtureScreen } from "@/screens/home/hooks/useFixtureScreen";\n\nexport function Fixture() {\n  const { label } = useFixtureScreen();\n  const [open, setOpen] = useState(false);\n  return open ? null : setOpen(Boolean(label));\n}\n`;

    const violations = await violationsOf(
      code,
      "src/screens/home/ui/Fixture.tsx",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(DUMB_UI);
  });

  it("service를 당긴 .tsx가 useEffect를 들면 걸린다", async () => {
    const code = `import { useEffect } from "react";\nimport { useFixtureMutation } from "@/features/fixtureEdit/services/useFixtureMutation";\n\nexport function Fixture() {\n  const save = useFixtureMutation();\n  useEffect(() => save(), [save]);\n  return null;\n}\n`;

    const violations = await violationsOf(
      code,
      "src/features/fixtureEdit/ui/Fixture.tsx",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(DUMB_UI);
  });

  it("api를 당긴 .tsx가 useReducer를 들면 걸린다", async () => {
    const code = `import { useReducer } from "react";\nimport { readFixture } from "@/entities/fixture/api/readFixture.api";\n\nexport function Fixture() {\n  const [count, bump] = useReducer((value: number) => value + 1, 0);\n  return readFixture ? null : bump(count);\n}\n`;

    const violations = await violationsOf(
      code,
      "src/screens/home/ui/Fixture.tsx",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(DUMB_UI);
  });

  it("이름을 바꿔 받은 useState도 걸린다", async () => {
    const code = `import { useState as useLocalState } from "react";\nimport { useFixtureScreen } from "@/screens/home/hooks/useFixtureScreen";\n\nexport function Fixture() {\n  useFixtureScreen();\n  const [open, setOpen] = useLocalState(false);\n  return open ? null : setOpen(true);\n}\n`;

    const violations = await violationsOf(
      code,
      "src/screens/home/ui/Fixture.tsx",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(DUMB_UI);
  });

  it("React 네임스페이스로 불러도 걸린다", async () => {
    const code = `import * as React from "react";\nimport { useFixtureScreen } from "@/screens/home/hooks/useFixtureScreen";\n\nexport function Fixture() {\n  useFixtureScreen();\n  const [open, setOpen] = React.useState(false);\n  return open ? null : setOpen(true);\n}\n`;

    const violations = await violationsOf(
      code,
      "src/screens/home/ui/Fixture.tsx",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(DUMB_UI);
  });

  it("controller를 재수출로 당겨도 상태가 걸린다", async () => {
    const code = `import { useState } from "react";\n\nexport { useFixtureScreen } from "@/screens/home/hooks/useFixtureScreen";\n\nexport function Fixture() {\n  const [open, setOpen] = useState(false);\n  return open ? null : setOpen(true);\n}\n`;

    const violations = await violationsOf(
      code,
      "src/screens/home/ui/Fixture.tsx",
    );

    expect(violations.map((violation) => violation.ruleId)).toContain(DUMB_UI);
  });

  it("controller를 당겨도 useMemo는 통과한다", async () => {
    const code = `import { useMemo } from "react";\nimport { useFixtureScreen } from "@/screens/home/hooks/useFixtureScreen";\n\nexport function Fixture() {\n  const { label } = useFixtureScreen();\n  const face = useMemo(() => ({ label }), [label]);\n  return face.label ? null : null;\n}\n`;

    const violations = await violationsOf(
      code,
      "src/screens/home/ui/Fixture.tsx",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      DUMB_UI,
    );
  });

  it("api에서 타입만 당긴 .tsx의 useState는 통과한다", async () => {
    const code = `import { useState } from "react";\n\nimport type { FixtureRow } from "@/entities/fixture/api/fixture.dto";\n\nexport function Fixture({ row }: { row: FixtureRow }) {\n  const [open, setOpen] = useState(false);\n  return open ? null : setOpen(Boolean(row));\n}\n`;

    const violations = await violationsOf(
      code,
      "src/screens/home/ui/Fixture.tsx",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      DUMB_UI,
    );
  });

  it("아무것도 안 당기고 너비만 재는 shared/ui는 통과한다", async () => {
    const code = `import { useState } from "react";\nimport { View } from "react-native";\n\nexport function Fixture() {\n  const [width, setWidth] = useState(0);\n  return (\n    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>\n      {width}\n    </View>\n  );\n}\n`;

    const violations = await violationsOf(code, "src/shared/ui/Fixture.tsx");

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      DUMB_UI,
    );
  });

  it("controller를 당긴 .ts는 상태 축 밖이다", async () => {
    const code = `import { useState } from "react";\nimport { useFixtureScreen } from "@/screens/home/hooks/useFixtureScreen";\n\nexport function useFixture() {\n  const { label } = useFixtureScreen();\n  return useState(label);\n}\n`;

    const violations = await violationsOf(
      code,
      "src/screens/home/hooks/useFixture.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      DUMB_UI,
    );
  });

  it("상태·props·클래스만 쓰는 더미 UI는 어느 규칙도 안 걸린다", async () => {
    const errors = await errorsOf(
      DUMB_COMPONENT,
      "src/screens/home/ui/Counter.tsx",
    );

    expect(errors).toEqual([]);
  });
});
