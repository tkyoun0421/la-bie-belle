import { API_SEGMENT, fileLocation } from "./segments.mjs";

const SNAKE_CASE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;
const GENERATED_TYPES = "src/shared/api/databaseTypes.ts";
const MAPPER_SUFFIX = ".mapper.ts";
const ROUTE_LAYER = "app";

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
        if (node.key.type === "Identifier") {
          check(node.key, node.key.name);
        }
      },
    };
  },
};

export default noSnakeCaseField;
