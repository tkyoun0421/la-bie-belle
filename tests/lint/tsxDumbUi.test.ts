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

  it("상태·props·클래스만 쓰는 더미 UI는 어느 규칙도 안 걸린다", async () => {
    const errors = await errorsOf(
      DUMB_COMPONENT,
      "src/screens/home/ui/Counter.tsx",
    );

    expect(errors).toEqual([]);
  });
});
