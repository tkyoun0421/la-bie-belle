import { errorsOf, violationsOf } from "@tests/lint/rule-check";

const DUMB_UI = "house/dumb-ui";

/**
 * 규칙이 평범한 더미 UI에 오탐하지 않는지 보는 픽스처다. 상태와 props와 클래스를
 * 쓰되 데이터에는 안 닿는다 — 규칙이 막으려는 것과 허용해야 하는 것의 경계가 여기다.
 *
 * 저장소의 실물을 베껴 두지 않는다. 사본은 소스를 안 따라가 썩고, 실제로 Next 시절
 * `layout.tsx`·`page.tsx`와 shadcn `button.tsx`를 베낀 픽스처 다섯이 그 파일들이
 * 없어진 뒤에도 남아 있었다. 실물이 규칙에 안 걸리는 것은 `pnpm lint`가 저장소
 * 전체에 같은 규칙을 돌려서 이미 본다.
 *
 * 클래스는 배치 유틸만 쓴다. 규칙19가 선 뒤로 화면 파일의 색·글자·모양 유틸은 그 자체로
 * 걸리는 것이라, 여기 두면 이 픽스처가 규칙9가 아니라 규칙19를 재게 된다.
 */
const DUMB_COMPONENT = `import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { cn } from "@/shared/lib/utils";

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
      "src/entities/profile/dals/fixture.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      DUMB_UI,
    );
  });

  it(".ts 파일의 fetch(...) 호출은 통과한다", async () => {
    const code = `export function load() {\n  return fetch("/api/profile");\n}\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/dals/fixture.ts",
    );

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      DUMB_UI,
    );
  });

  it(".ts 파일의 useQuery 호출은 통과한다", async () => {
    const code = `import { useQuery } from "@tanstack/react-query";\n\nexport function useLoad() {\n  return useQuery({ queryKey: ["x"], queryFn: async () => null });\n}\n`;

    const violations = await violationsOf(
      code,
      "src/entities/profile/dals/fixture.ts",
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

  /**
   * 규칙이 `src/app/providers.tsx` 하나를 이름으로 빼주고 있었다. Next 시절
   * QueryClientProvider를 세우던 자리인데 그 파일이 없어진 뒤로는 아무 파일도
   * 안 가리키는 빠져나갈 구멍이었다. 이름으로 주는 면제를 안 둔다.
   */
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
