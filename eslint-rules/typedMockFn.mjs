const FUNCTION_TYPES = new Set(["TSFunctionType", "TSConstructorType"]);

function isJestFn(callee) {
  return (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.object.type === "Identifier" &&
    callee.object.name === "jest" &&
    callee.property.type === "Identifier" &&
    callee.property.name === "fn"
  );
}

function isNode(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.type === "string"
  );
}

function containsUnknown(node, visitorKeys) {
  if (node.type === "TSUnknownKeyword") {
    return true;
  }

  return (visitorKeys[node.type] ?? []).some((key) => {
    const child = node[key];
    const children = Array.isArray(child) ? child : [child];

    return children.some(
      (each) => isNode(each) && containsUnknown(each, visitorKeys),
    );
  });
}

const typedMockFn = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`jest.fn`의 함수 타입 인자에 `unknown`을 적는 것을 막는다. 그 서명이면 픽스처가 어떤 꼴이어도 typecheck를 지나간다.",
    },
    schema: [],
    messages: {
      untyped:
        "`jest.fn` 의 서명에 `unknown` 을 적지 않는다. 실물 서명을 `typeof <함수>` 로 박는다 — `import type` 은 런타임에 사라져 mock을 안 피하고, 픽스처가 실물 반환 타입에 맞아야 typecheck를 지난다.",
    },
  },
  create(context) {
    const { visitorKeys } = context.sourceCode;

    return {
      CallExpression(node) {
        if (!isJestFn(node.callee)) {
          return;
        }

        const signature = node.typeArguments?.params[0];

        if (
          signature === undefined ||
          !FUNCTION_TYPES.has(signature.type) ||
          !containsUnknown(signature, visitorKeys)
        ) {
          return;
        }

        context.report({ node: signature, messageId: "untyped" });
      },
    };
  },
};

export default typedMockFn;
