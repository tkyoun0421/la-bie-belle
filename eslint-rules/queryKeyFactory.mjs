import path from "node:path";

const TESTS_FOLDER = "__tests__";

const KEY_PROPERTIES = new Set(["queryKey", "mutationKey"]);

const CACHE_METHODS = new Set([
  "invalidateQueries",
  "removeQueries",
  "resetQueries",
  "cancelQueries",
  "refetchQueries",
  "getQueryData",
  "setQueryData",
]);

function propertyNameOf(node) {
  if (node.computed) {
    return null;
  }

  if (node.key.type === "Identifier") {
    return node.key.name;
  }

  return node.key.type === "Literal" ? node.key.value : null;
}

const queryKeyFactory = {
  meta: {
    type: "problem",
    docs: {
      description:
        "캐시 키를 배열 리터럴로 적는 것을 막는다. `shared/api/queryKeys.ts`의 팩토리만 쓴다.",
    },
    schema: [],
    messages: {
      property:
        "'{{property}}' 에 배열을 직접 적지 않는다. 캐시 키의 정본은 `shared/api/queryKeys.ts`의 팩토리고, 거기 없는 접두사를 손으로 지으면 키가 바뀔 때 무효화가 아무것도 안 낡게 하고도 아무 데서도 안 터진다.",
      argument:
        "'{{method}}' 에 캐시 키 배열을 직접 넘기지 않는다. `shared/api/queryKeys.ts`의 팩토리가 낸 키를 넘겨라.",
    },
  },
  create(context) {
    const here = path
      .relative(context.cwd, context.filename)
      .split(path.sep)
      .join("/");

    if (here.split("/").includes(TESTS_FOLDER)) {
      return {};
    }

    return {
      Property(node) {
        const property = propertyNameOf(node);

        if (
          !KEY_PROPERTIES.has(property) ||
          node.value.type !== "ArrayExpression"
        ) {
          return;
        }

        context.report({
          node: node.value,
          messageId: "property",
          data: { property },
        });
      },

      CallExpression(node) {
        const { callee } = node;

        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          callee.property.type !== "Identifier" ||
          !CACHE_METHODS.has(callee.property.name)
        ) {
          return;
        }

        const [first] = node.arguments;

        if (first?.type !== "ArrayExpression") {
          return;
        }

        context.report({
          node: first,
          messageId: "argument",
          data: { method: callee.property.name },
        });
      },
    };
  },
};

export default queryKeyFactory;
