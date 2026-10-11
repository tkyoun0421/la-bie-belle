const CONTROLLER_SUFFIX = "Controller";

const controllerTypeNotGeneric = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`*Controller` 별칭을 제네릭 인스턴스화로 쓰는 것을 막는다. 가지를 글로 적지 않으면 상태 계약을 보는 검사가 통째로 꺼진다.",
    },
    schema: [],
    messages: {
      generic:
        "'{{name}}' 를 '{{generic}}' 의 인스턴스화로 쓰지 않는다. 가지를 인라인 union으로 적어라 — 타입 인자 안에 감춘 가지는 `house/fragment-state-contract`가 못 읽어 상태 이름과 납작한 꼴을 아무도 세지 않는다.",
    },
  },
  create(context) {
    return {
      TSTypeAliasDeclaration(node) {
        if (!node.id.name.endsWith(CONTROLLER_SUFFIX)) {
          return;
        }

        const shape = node.typeAnnotation;

        if (
          shape.type !== "TSTypeReference" ||
          shape.typeArguments === undefined ||
          shape.typeArguments.params.length === 0
        ) {
          return;
        }

        context.report({
          node: shape,
          messageId: "generic",
          data: {
            name: node.id.name,
            generic: context.sourceCode.getText(shape.typeName),
          },
        });
      },
    };
  },
};

export default controllerTypeNotGeneric;
