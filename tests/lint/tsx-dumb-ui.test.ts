import { describe, expect, it } from "vitest";
import { errorsOf, violationsOf } from "@tests/lint/rule-check";

const DUMB_UI = "house/dumb-ui";

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

  it("src/app/providers.tsx 경로의 @supabase/* import는 예외로 통과한다", async () => {
    const code = `import { createClient } from "@supabase/supabase-js";\n\nexport function Providers() {\n  createClient("url", "key");\n  return null;\n}\n`;

    const violations = await violationsOf(code, "src/app/providers.tsx");

    expect(violations.map((violation) => violation.ruleId)).not.toContain(
      DUMB_UI,
    );
  });

  it("src/shared/ui/의 fetch(...) 호출은 예외가 아니라 걸린다", async () => {
    const code = `export function Fixture() {\n  fetch("/api/profile");\n  return null;\n}\n`;

    const violations = await violationsOf(code, "src/shared/ui/fixture.tsx");

    expect(violations.map((violation) => violation.ruleId)).toContain(DUMB_UI);
  });

  it("회귀 — page.tsx는 어느 규칙도 안 걸린다", async () => {
    const code = `import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>La Bie Belle</CardTitle>
          <CardDescription>프로젝트 스캐폴드가 준비되었습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button>시작하기</Button>
        </CardContent>
      </Card>
    </main>
  );
}
`;

    const errors = await errorsOf(code, "src/app/page.tsx");

    expect(errors).toEqual([]);
  });

  it("회귀 — layout.tsx는 어느 규칙도 안 걸린다", async () => {
    const code = `import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/app/providers";
import "@/app/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "La Bie Belle",
  description: "La Bie Belle",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={\`\${geistSans.variable} \${geistMono.variable} h-full antialiased\`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
`;

    const errors = await errorsOf(code, "src/app/layout.tsx");

    expect(errors).toEqual([]);
  });

  it("회귀 — providers.tsx는 어느 규칙도 안 걸린다", async () => {
    const code = `"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
`;

    const errors = await errorsOf(code, "src/app/providers.tsx");

    expect(errors).toEqual([]);
  });

  it("회귀 — button.tsx는 어느 규칙도 안 걸린다", async () => {
    const code = `import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
`;

    const errors = await errorsOf(code, "src/shared/ui/button.tsx");

    expect(errors).toEqual([]);
  });

  it("회귀 — card.tsx는 어느 규칙도 안 걸린다", async () => {
    const code = `import * as React from "react"

import { cn } from "@/shared/lib/utils"

function Card({
  className,
  size = "default",
  ...props
}: React.ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return (
    <div
      data-slot="card"
      data-size={size}
      className={cn(
        "group/card flex flex-col gap-(--card-spacing) overflow-hidden rounded-xl bg-card py-(--card-spacing) text-sm text-card-foreground ring-1 ring-foreground/10 [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:[--card-spacing:--spacing(3)] data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-t-xl px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "font-heading text-base leading-snug font-medium group-data-[size=sm]/card:text-sm",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl border-t bg-muted/50 p-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
`;

    const errors = await errorsOf(code, "src/shared/ui/card.tsx");

    expect(errors).toEqual([]);
  });
});
