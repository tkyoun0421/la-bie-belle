import {
  API_SEGMENT,
  importEdges,
  isTypeOnly,
  specifierLocation,
} from "./segments.mjs";

const PURE_SUFFIXES = [".policy.ts", ".reducer.ts"];

const CLOCK_READS = new Map([
  ["now", "Date.now()"],
  ["parse", "Date.parse()"],
]);

const purePolicy = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`.policy.ts`·`.reducer.ts`가 통신·시계·난수를 만지는 것을 막는다.",
    },
    schema: [],
    messages: {
      api: "'{{source}}' 는 통신 계층이다. `.policy.ts`·`.reducer.ts`는 순수해서 통신을 모르니, 주고받는 꼴만 필요하면 `.dto.ts`에서 타입으로 받아 서명에 적어라.",
      clock:
        "'{{read}}' 는 기기 시계를 읽는다. 「지금」이 필요한 판정은 그 값을 인자로 받아라 — 서버 시계가 정본이고 기기 시계는 밀린다.",
      random:
        "'Math.random()' 은 같은 입력에 다른 답을 낸다. `.policy.ts`·`.reducer.ts`는 순수해서 부르는 쪽이 뽑은 값을 인자로 받아라.",
    },
  },
  create(context) {
    if (!PURE_SUFFIXES.some((suffix) => context.filename.endsWith(suffix))) {
      return {};
    }

    function reportClockRead(node, read) {
      context.report({ node, messageId: "clock", data: { read } });
    }

    return {
      ...importEdges((node) => {
        const source = node.source.value;

        if (specifierLocation(source)?.segment !== API_SEGMENT) {
          return;
        }

        if (isTypeOnly(node)) {
          return;
        }

        context.report({
          node: node.source,
          messageId: "api",
          data: { source },
        });
      }),

      NewExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "Date" &&
          node.arguments.length === 0
        ) {
          reportClockRead(node, "new Date()");
        }
      },

      CallExpression(node) {
        const { callee } = node;

        if (
          callee.type !== "MemberExpression" ||
          callee.computed ||
          callee.object.type !== "Identifier" ||
          callee.property.type !== "Identifier"
        ) {
          return;
        }

        const method = callee.property.name;

        if (callee.object.name === "Math" && method === "random") {
          context.report({ node, messageId: "random" });
          return;
        }

        if (callee.object.name !== "Date" || node.arguments.length > 0) {
          return;
        }

        const read = CLOCK_READS.get(method);

        if (read) {
          reportClockRead(node, read);
        }
      },
    };
  },
};

export default purePolicy;
