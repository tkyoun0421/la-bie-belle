import { API_SEGMENT, fileLocation } from "./segments.mjs";

const SNAKE_CASE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;
const GENERATED_TYPES = "src/shared/api/databaseTypes.ts";
const MAPPER_SUFFIX = ".mapper.ts";
const ROUTE_LAYER = "app";

const KEY_ARGUMENT_OF = new Map([
  ["Record", 0],
  ["Pick", 1],
  ["Omit", 1],
]);

function keyNameOf(key) {
  if (key.type === "Identifier") {
    return key.name;
  }

  if (key.type === "Literal" && typeof key.value === "string") {
    return key.value;
  }

  return null;
}

function* stringLiteralsIn(type) {
  if (type.type === "TSUnionType") {
    for (const member of type.types) {
      yield* stringLiteralsIn(member);
    }
  } else if (
    type.type === "TSLiteralType" &&
    type.literal.type === "Literal" &&
    typeof type.literal.value === "string"
  ) {
    yield type.literal;
  }
}

const noSnakeCaseField = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`api/` 밖에서 snake_case 속성 이름을 쓰는 것을 막는다. DB 열 이름은 `api`를 안 떠난다.",
    },
    schema: [],
    messages: {
      snakeField:
        "'{{name}}' 는 DB 열 이름이고 `api/`를 안 떠난다. `api/*.api.ts`가 `utils/<도메인>.mapper.ts`를 불러 camelCase로 바꿔 돌려주고, 이 파일은 `model/<도메인>.type.ts`의 도메인 타입을 받아라. `src/app/`의 라우트는 이 축 밖이다 — URL과 쿼리 파라미터의 이름은 밖에서 온다.",
    },
  },
  create(context) {
    const here = fileLocation(context);

    if (
      here?.segment === API_SEGMENT ||
      here?.layer === ROUTE_LAYER ||
      context.filename.endsWith(GENERATED_TYPES) ||
      context.filename.endsWith(MAPPER_SUFFIX)
    ) {
      return {};
    }

    function check(node, name) {
      if (SNAKE_CASE.test(name)) {
        context.report({ node, messageId: "snakeField", data: { name } });
      }
    }

    return {
      TSPropertySignature(node) {
        const name = keyNameOf(node.key);

        if (name !== null) {
          check(node.key, name);
        }
      },
      TSTypeReference(node) {
        if (node.typeName.type !== "Identifier") {
          return;
        }

        const position = KEY_ARGUMENT_OF.get(node.typeName.name);
        const keys =
          position === undefined
            ? undefined
            : node.typeArguments?.params[position];

        if (keys === undefined) {
          return;
        }

        for (const literal of stringLiteralsIn(keys)) {
          check(literal, literal.value);
        }
      },
    };
  },
};

export default noSnakeCaseField;
