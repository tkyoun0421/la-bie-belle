import { readFileSync } from "node:fs";
import path from "node:path";

const CANON_FILE = "src/shared/consts/navigation.const.ts";

const CANON_IMPORT = "@/shared/consts/navigation.const";

const ROUTE_FOLDER = "src/app/";

const TESTS_FOLDER = "__tests__";

const DECLARATION = /export const ([A-Z][A-Z0-9_]*) = "(\/[^"]+)"/g;

const FOLLOWERS = ["?", "#"];

function canonRoutes() {
  const source = readFileSync(
    new URL(`../${CANON_FILE}`, import.meta.url),
    "utf8",
  );

  return [...source.matchAll(DECLARATION)]
    .map(([, name, route]) => ({ name, route }))
    .sort((a, b) => b.route.length - a.route.length);
}

const ROUTES = canonRoutes();

function routeAtStartOf(text) {
  return ROUTES.find(({ route }) => {
    if (!text.startsWith(route)) {
      return false;
    }

    const rest = text.slice(route.length);

    return rest === "" || FOLLOWERS.includes(rest[0]);
  });
}

function isModuleSpecifier(node) {
  const parent = node.parent;

  return (
    parent !== undefined &&
    parent !== null &&
    "source" in parent &&
    parent.source === node
  );
}

function relativeTo(context) {
  return path.relative(context.cwd, context.filename).split(path.sep).join("/");
}

const noRoutePathLiteral = {
  meta: {
    type: "problem",
    docs: {
      description: `${CANON_FILE} 밖에서 경로 글자를 다시 적는 것을 막는다. 라우트 파일 이름을 바꾸는 날 고칠 자리가 한 곳이도록 경로는 상수로만 산다. 정본 자신과 \`${ROUTE_FOLDER}\`와 짝 테스트는 밖이고, 경로인지 가를 수 없는 \`"/"\` 하나도 밖이다.`,
    },
    schema: [],
    messages: {
      literal: `'{{route}}' 는 경로다. '${CANON_IMPORT}' 의 {{name}} 을 가리켜라 — 글자가 여러 집에 살면 라우트 파일 이름을 바꾸는 날 한 집을 놓친다.`,
    },
  },
  create(context) {
    const here = relativeTo(context);

    if (
      here === CANON_FILE ||
      here.startsWith(ROUTE_FOLDER) ||
      here.split("/").includes(TESTS_FOLDER)
    ) {
      return {};
    }

    function reportIfRoute(node, text) {
      if (typeof text !== "string") {
        return;
      }

      const found = routeAtStartOf(text);

      if (found === undefined) {
        return;
      }

      context.report({
        node,
        messageId: "literal",
        data: { route: found.route, name: found.name },
      });
    }

    return {
      Literal(node) {
        if (node.regex !== undefined || isModuleSpecifier(node)) {
          return;
        }

        reportIfRoute(node, node.value);
      },

      TemplateElement(node) {
        reportIfRoute(node, node.value.cooked ?? node.value.raw);
      },
    };
  },
};

export default noRoutePathLiteral;
