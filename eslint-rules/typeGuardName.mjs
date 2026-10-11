const GUARD_NAME = /^is[A-Z]/;

function nameOf(node, parent) {
  if (node.id?.type === "Identifier") {
    return node.id.name;
  }

  if (
    parent?.type === "VariableDeclarator" &&
    parent.id.type === "Identifier"
  ) {
    return parent.id.name;
  }

  const keyed =
    parent?.type === "Property" ||
    parent?.type === "MethodDefinition" ||
    parent?.type === "PropertyDefinition";

  return keyed && parent.key.type === "Identifier" ? parent.key.name : null;
}

function check(context, node) {
  if (node.returnType?.typeAnnotation.type !== "TSTypePredicate") {
    return;
  }

  const name = nameOf(node, node.parent);

  if (name === null || GUARD_NAME.test(name)) {
    return;
  }

  context.report({
    node: node.returnType,
    messageId: "guardName",
    data: { name },
  });
}

const typeGuardName = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`값 is 좁은타입`을 돌려주는 함수가 `is`로 시작하지 않는 것을 막는다.",
    },
    schema: [],
    messages: {
      guardName:
        "'{{name}}' 은 타입을 좁히는 가드인데 이름이 `is`로 시작하지 않는다. 가드의 주장은 TS가 검사하지 않아 거짓일 수 있으니, 호출부가 이름만 보고 「여기서 좁힌다」를 알게 `is<좁힌것>` 꼴로 불러라.",
    },
  },
  create(context) {
    return {
      FunctionDeclaration: (node) => check(context, node),
      FunctionExpression: (node) => check(context, node),
      ArrowFunctionExpression: (node) => check(context, node),
      TSDeclareFunction: (node) => check(context, node),
    };
  },
};

export default typeGuardName;
