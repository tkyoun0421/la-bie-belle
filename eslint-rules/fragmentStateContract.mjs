const WATCHED_SUFFIXES = ["Controller", "ListState", "Body"];

const STATE_FIELD = "state";

const STATE_NAMES = new Set(["pending", "failed", "empty", "ready", "sending"]);

function isWatchedAlias(node) {
  return WATCHED_SUFFIXES.some((suffix) => node.id.name.endsWith(suffix));
}

function propertyName(member) {
  if (member.type !== "TSPropertySignature") {
    return null;
  }

  if (member.key.type === "Identifier") {
    return member.key.name;
  }

  return member.key.type === "Literal" ? member.key.value : null;
}

function stateMemberOf(literal) {
  return (
    literal.members.find((member) => propertyName(member) === STATE_FIELD) ??
    null
  );
}

function branchesOf(node) {
  return node.type === "TSUnionType" ? node.types : [node];
}

function stateLiteralsOf(branch) {
  if (branch.type !== "TSTypeLiteral") {
    return [];
  }

  const member = stateMemberOf(branch);
  const annotation = member?.typeAnnotation?.typeAnnotation;

  if (!annotation) {
    return [];
  }

  return branchesOf(annotation).filter(
    (one) => one.type === "TSLiteralType" && one.literal.type === "Literal",
  );
}

const fragmentStateContract = {
  meta: {
    type: "problem",
    docs: {
      description:
        "controller와 목록 상태의 상태를 판별 union으로 묶고 상태 이름을 정본 다섯으로 가둔다.",
    },
    schema: [],
    messages: {
      flat: "'{{name}}' 의 `state`가 납작하다. 가지마다 자기 데이터만 드는 판별 union으로 갈라라 — 기다리는 가지가 ready의 값을 들고 있으면 타입이 실수를 못 잡는다.",
      name: "'{{state}}' 는 상태 이름이 아니다. 읽기는 pending·failed·empty·ready 넷이고 쓰는 중은 sending 하나다. 늘리려는 가지는 대개 상태가 아니라 그 가지의 데이터다.",
    },
  },
  create(context) {
    return {
      TSTypeAliasDeclaration(node) {
        if (!isWatchedAlias(node)) {
          return;
        }

        const shape = node.typeAnnotation;

        if (shape.type === "TSTypeLiteral" && stateMemberOf(shape) !== null) {
          context.report({
            node: stateMemberOf(shape),
            messageId: "flat",
            data: { name: node.id.name },
          });
        }

        for (const branch of branchesOf(shape)) {
          for (const literal of stateLiteralsOf(branch)) {
            if (!STATE_NAMES.has(literal.literal.value)) {
              context.report({
                node: literal,
                messageId: "name",
                data: { state: literal.literal.value },
              });
            }
          }
        }
      },
    };
  },
};

export default fragmentStateContract;
