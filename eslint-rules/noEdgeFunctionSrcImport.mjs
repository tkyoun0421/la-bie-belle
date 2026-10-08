import path from "node:path";

const FUNCTIONS_ROOT = "supabase/functions";

const noEdgeFunctionSrcImport = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Edge Function이 마운트 밖(`supabase/functions` 바깥)을 import하는 것을 막는다.",
    },
    schema: [],
    messages: {
      outsideMount:
        "'{{specifier}}' 는 edge-runtime 컨테이너에 없다. `supabase/functions` 한 폴더만 마운트돼서, 밖을 가리키면 배포한 함수가 부팅에서 깨진다. `pnpm edge:sync`가 만드는 `_shared` 복사본을 가리켜라.",
    },
  },
  create(context) {
    const toPosix = (value) => value.split(path.sep).join("/");
    const relative = toPosix(path.relative(context.cwd, context.filename));

    if (!relative.startsWith(`${FUNCTIONS_ROOT}/`)) {
      return {};
    }

    const here = path.dirname(context.filename);
    const mount = path.join(context.cwd, FUNCTIONS_ROOT);

    return {
      ImportDeclaration(node) {
        const specifier = node.source.value;

        if (
          typeof specifier !== "string" ||
          !(specifier.startsWith("./") || specifier.startsWith("../"))
        ) {
          return;
        }

        const resolved = path.resolve(here, specifier);

        if (resolved === mount || resolved.startsWith(`${mount}${path.sep}`)) {
          return;
        }

        context.report({
          node: node.source,
          messageId: "outsideMount",
          data: { specifier },
        });
      },
    };
  },
};

export default noEdgeFunctionSrcImport;
