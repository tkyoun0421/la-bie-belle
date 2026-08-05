import { describe } from "vitest";

import { createRuleTester } from "../../test-support/rule-tester.mjs";
import rule from "../import-alias.mjs";

const ruleTester = createRuleTester();

describe("import-alias", () => {
  ruleTester.run("import-alias", rule, {
    valid: [
      {
        name: "@/ alias import는 허용한다",
        filename: "src/features/apply/api/apply.ts",
        code: 'import { ERROR_CODE } from "@/shared/config/error-codes.config";',
      },
      {
        name: "패키지 import는 허용한다",
        filename: "src/features/apply/api/apply.ts",
        code: 'import { z } from "zod";',
      },
      {
        name: "비리터럴 동적 import는 검사하지 않는다",
        filename: "src/features/apply/api/apply.ts",
        code: "const mod = await import(path);",
      },
      {
        name: "템플릿 리터럴 동적 import는 검사하지 않는다",
        filename: "src/features/apply/api/apply.ts",
        code: "const mod = await import(`./${name}`);",
      },
    ],
    invalid: [
      {
        name: "같은 폴더 상대 import를 alias로 고친다",
        filename: "src/shared/lib/format-date.ts",
        code: 'import { helper } from "./helper";',
        output: 'import { helper } from "@/shared/lib/helper";',
        errors: [{ messageId: "relativeImport" }],
      },
      {
        name: "다단 ../ 상대 import를 alias로 고친다",
        filename: "src/widgets/offline/hooks/useOnlineStatus.ts",
        code: 'import { supabase } from "../../../shared/lib/supabase-browser";',
        output: 'import { supabase } from "@/shared/lib/supabase-browser";',
        errors: [{ messageId: "relativeImport" }],
      },
      {
        name: "확장자 포함 상대 import에서 확장자를 제거한다",
        filename: "src/views/status/ui/ErrorScreen.tsx",
        code: 'import { Layout } from "./Layout.tsx";',
        output: 'import { Layout } from "@/views/status/ui/Layout";',
        errors: [{ messageId: "relativeImport" }],
      },
      {
        name: "named re-export도 alias로 고친다",
        filename: "src/shared/lib/reexport.ts",
        code: 'export { helper } from "./helper";',
        output: 'export { helper } from "@/shared/lib/helper";',
        errors: [{ messageId: "relativeImport" }],
      },
      {
        name: "export * 도 alias로 고친다",
        filename: "src/shared/lib/reexport.ts",
        code: 'export * from "./helper";',
        output: 'export * from "@/shared/lib/helper";',
        errors: [{ messageId: "relativeImport" }],
      },
      {
        name: "동적 import 문자열 리터럴도 alias로 고친다",
        filename: "src/widgets/offline/ui/OfflineBanner.tsx",
        code: 'const mod = await import("./helpers");',
        output: 'const mod = await import("@/widgets/offline/ui/helpers");',
        errors: [{ messageId: "relativeImport" }],
      },
      {
        name: "src/ 밖으로 벗어나는 상대 import는 fix 없이 보고한다(F-01)",
        filename: "src/shared/lib/format-date.ts",
        code: 'import { helper } from "../../../outside";',
        errors: [{ messageId: "unresolvableImport" }],
      },
      {
        name: "src 최상위 파일에서도 상대 import를 보고하고, 계층 대상이면 fix한다(F-02)",
        filename: "src/proxy.ts",
        code: 'import { supabase } from "./shared/lib/supabase-browser";',
        output: 'import { supabase } from "@/shared/lib/supabase-browser";',
        errors: [{ messageId: "relativeImport" }],
      },
      {
        name: "계약의 계층 접두가 아닌 대상은 fix 없이 보고만 한다(F-03)",
        filename: "src/app/layout.tsx",
        code: 'import { proxy } from "../proxy";',
        errors: [{ messageId: "relativeImport" }],
      },
    ],
  });
});
