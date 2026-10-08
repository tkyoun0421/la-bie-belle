import path from "node:path";
import { fileLocation, importEdges, isTypeOnly } from "./segments.mjs";

const CONFIG_SEGMENT = "config";
const ROUTE_LAYER = "app";
const TESTS_FOLDER = "__tests__";

const EXPO_CONSTANTS = "expo-constants";

function isPairTest(filename) {
  return filename.split(path.sep).includes(TESTS_FOLDER);
}

const envInConfig = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`config` 세그먼트 밖에서 `process.env`를 읽거나 `expo-constants`를 당기는 것을 막는다. `src/app/`의 라우트 파일과 짝 테스트는 밖이다.",
    },
    schema: [],
    messages: {
      processEnv:
        "`process.env` 는 개발과 운영에서 값이 다르다. `config/<슬라이스>.config.ts`가 읽어 돌려주고, 이 파일은 그것을 불러 받아라.",
      expoConstants:
        "'{{source}}' 는 `app.json`과 실행 중인 껍데기가 아는 값을 읽는다. `config/<슬라이스>.config.ts`가 읽어 돌려주고, 이 파일은 그것을 불러 받아라.",
    },
  },
  create(context) {
    const here = fileLocation(context);

    if (
      !here ||
      here.layer === ROUTE_LAYER ||
      here.segment === CONFIG_SEGMENT ||
      isPairTest(context.filename)
    ) {
      return {};
    }

    return {
      ...importEdges((node) => {
        if (node.source.value !== EXPO_CONSTANTS || isTypeOnly(node)) {
          return;
        }

        context.report({
          node: node.source,
          messageId: "expoConstants",
          data: { source: node.source.value },
        });
      }),

      MemberExpression(node) {
        if (
          node.object.type !== "Identifier" ||
          node.object.name !== "process" ||
          node.property.type !== "Identifier" ||
          node.property.name !== "env"
        ) {
          return;
        }

        context.report({ node, messageId: "processEnv" });
      },
    };
  },
};

export default envInConfig;
