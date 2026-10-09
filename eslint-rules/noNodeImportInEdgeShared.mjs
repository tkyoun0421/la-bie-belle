import path from "node:path";

const COPIED_TO_DENO = [
  "src/entities/notification/consts/",
  "src/entities/notification/model/",
  "src/entities/notification/utils/",
  "src/features/holiday/model/",
  "src/features/holiday/utils/",
];

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
