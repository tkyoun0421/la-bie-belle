import { QUERY_HOOKS, QUERY_PACKAGE } from "./queryHooks.mjs";
import {
  fileLocation,
  importEdges,
  isTypeOnly,
  specifierLocation,
} from "./segments.mjs";

const SUPABASE = /^@supabase\//;
const GLOBALS = new Set(["window", "globalThis", "global", "self"]);
const REACT_PACKAGE = "react";
const STATE_HOOKS = new Set(["useState", "useEffect", "useReducer"]);
const LOGIC_SEGMENTS = new Set(["api", "services", "hooks"]);
const ROUTE_LAYER = "app";

const dumbUi = {
  meta: {
    type: "problem",
    docs: {
      description:
        "화면 파일이 데이터를 직접 가져오는 것과, 로직을 당긴 화면이 상태를 드는 것을 막는다. ADR-001 「화면과 로직」의 집행이다.",
    },
    schema: [],
    messages: {
      database:
        "화면 파일은 데이터베이스에 직접 붙지 않는다. '{{source}}' 는 .ts 로 빼라.",
      network: "화면 파일은 직접 통신하지 않는다. fetch 호출을 .ts 로 빼라.",
      queryHook:
        "화면 파일은 서버 상태를 직접 읽지 않는다. '{{hook}}' 호출을 .ts 로 빼라.",
      state:
        "'{{source}}' 를 당긴 화면 파일은 상태를 들지 않는다. '{{hook}}' 를 `hooks/use<화면>.ts`의 controller로 올리고 `.tsx`는 돌려받은 것만 그려라. 계산을 아끼는 `useMemo` 는 그대로 둬도 된다. `src/app/`의 라우트 파일은 앱 수명을 들어 이 축 밖이다.",
    },
  },
  create(context) {
    const hookBindings = new Map();
    const namespaceBindings = new Set();
    const stateBindings = new Map();
    const reactNamespaces = new Set();
    const calls = [];
    let logicSource = null;

    function recordLogicEdge(node) {
      if (
        logicSource !== null ||
        isTypeOnly(node) ||
        fileLocation(context)?.layer === ROUTE_LAYER
      ) {
        return;
      }

      const source = node.source.value;

      if (LOGIC_SEGMENTS.has(specifierLocation(source)?.segment)) {
        logicSource = source;
      }
    }

    function recordReactBindings(node) {
      if (node.source.value !== REACT_PACKAGE) {
        return;
      }

      for (const specifier of node.specifiers) {
        if (
          specifier.type === "ImportSpecifier" &&
          STATE_HOOKS.has(specifier.imported.name)
        ) {
          stateBindings.set(specifier.local.name, specifier.imported.name);
        }
        if (
          specifier.type === "ImportNamespaceSpecifier" ||
          specifier.type === "ImportDefaultSpecifier"
        ) {
          reactNamespaces.add(specifier.local.name);
        }
      }
    }

    function recordDataAccess(node) {
      const source = node.source.value;

      if (SUPABASE.test(source)) {
        context.report({
          node: node.source,
          messageId: "database",
          data: { source },
        });
      }

      if (source !== QUERY_PACKAGE) {
        return;
      }

      for (const specifier of node.specifiers) {
        if (
          specifier.type === "ImportSpecifier" &&
          QUERY_HOOKS.has(specifier.imported.name)
        ) {
          hookBindings.set(specifier.local.name, specifier.imported.name);
        }
        if (specifier.type === "ImportNamespaceSpecifier") {
          namespaceBindings.add(specifier.local.name);
        }
      }
    }

    function reportState(node, hook) {
      context.report({
        node,
        messageId: "state",
        data: { hook, source: logicSource },
      });
    }

    return {
      ...importEdges(recordLogicEdge),

      ImportDeclaration(node) {
        recordLogicEdge(node);
        recordReactBindings(node);
        recordDataAccess(node);
      },

      CallExpression(node) {
        calls.push(node);
      },

      "Program:exit"() {
        for (const node of calls) {
          const { callee } = node;

          if (callee.type === "Identifier") {
            if (callee.name === "fetch") {
              context.report({ node, messageId: "network" });
            } else if (hookBindings.has(callee.name)) {
              context.report({
                node,
                messageId: "queryHook",
                data: { hook: hookBindings.get(callee.name) },
              });
            } else if (logicSource !== null && stateBindings.has(callee.name)) {
              reportState(node, stateBindings.get(callee.name));
            }
            continue;
          }

          if (
            callee.type !== "MemberExpression" ||
            callee.object.type !== "Identifier"
          ) {
            continue;
          }

          const object = callee.object.name;
          const property = callee.property.name;

          if (GLOBALS.has(object) && property === "fetch") {
            context.report({ node, messageId: "network" });
          } else if (
            namespaceBindings.has(object) &&
            QUERY_HOOKS.has(property)
          ) {
            context.report({
              node,
              messageId: "queryHook",
              data: { hook: property },
            });
          } else if (
            logicSource !== null &&
            reactNamespaces.has(object) &&
            STATE_HOOKS.has(property)
          ) {
            reportState(node, property);
          }
        }
      },
    };
  },
};

export default dumbUi;
