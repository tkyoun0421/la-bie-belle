import path from "node:path";

/**
 * `src/features/notification/model/`은 `pnpm edge:sync`가 `supabase/functions/_shared/`로
 * 복사해 Deno로 돌리는 폴더다(notification/design.md 「푸시 보내기」). Node 전용 API를
 * 부르면 앱에서는 멀쩡하고 복사본만 런타임에서 깨진다 — 정본이 「lint가 막는다」고 적어둔
 * 그 자리다.
 *
 * 무는 자리를 규칙이 들고 있다. `eslint.config.mjs`는 넓게 켜고 어느 폴더가 복사되는지는
 * 여기 아래 목록이 안다 — 복사 대상이 늘면 이 목록과 `scripts/syncEdgeShared.mts`가 같이
 * 는다.
 */

const COPIED_TO_DENO = ["src/features/notification/model/"];

const noNodeImportInEdgeShared = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Deno로 복사되는 폴더에서 `node:` import를 쓰는 것을 막는다.",
    },
    schema: [],
    messages: {
      nodeBuiltin:
        "'{{specifier}}' 는 Node 전용이다. 이 폴더는 `supabase/functions/_shared/`로 복사돼 Deno로 도니, 표준 웹 API나 순수 계산으로 풀어라.",
    },
  },
  create(context) {
    const relative = path
      .relative(context.cwd, context.filename)
      .split(path.sep)
      .join("/");

    if (!COPIED_TO_DENO.some((folder) => relative.startsWith(folder))) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        const specifier = node.source.value;

        if (typeof specifier !== "string" || !specifier.startsWith("node:")) {
          return;
        }

        context.report({
          node: node.source,
          messageId: "nodeBuiltin",
          data: { specifier },
        });
      },
    };
  },
};

export default noNodeImportInEdgeShared;
