import { fileLocation, importEdges, isTypeOnly } from "./segments.mjs";

const APP_LAYER = "app";
const DEVICE_SEGMENTS = new Set(["lib", "ui", "hooks"]);
const ENVIRONMENT_SEGMENT = "config";
const NATIVE_PACKAGE = "react-native";
const EXPO_PACKAGE = "expo";
const EXPO_SCOPE = "expo-";

function isNativeSdk(source) {
  if (typeof source !== "string") {
    return false;
  }

  if (source === NATIVE_PACKAGE || source.startsWith(`${NATIVE_PACKAGE}/`)) {
    return true;
  }

  return source === EXPO_PACKAGE || source.startsWith(EXPO_SCOPE);
}

const nativeSdkSegment = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`expo-*`·`react-native` SDK를 값으로 당기는 자리를 `lib`·`ui`·`hooks`로 가둔다. 타입만 당기는 것과 `config`의 환경값 읽기와 `src/app/`의 라우트 파일은 통과한다.",
    },
    schema: [],
    messages: {
      device:
        "'{{source}}' 는 기기에 닿는 손이다. 부작용을 내는 자리는 `lib/`이고 화면이 쥐는 자리는 `ui`·`hooks`다. `{{segment}}` 는 무엇에 닿는지를 모르니 그 손을 `lib/`로 빼고 결과만 받아라. 타입만 필요하면 `import type` 으로 당겨라.",
    },
  },
  create(context) {
    const here = fileLocation(context);

    if (
      !here ||
      here.layer === APP_LAYER ||
      here.segment === null ||
      here.segment === ENVIRONMENT_SEGMENT ||
      DEVICE_SEGMENTS.has(here.segment)
    ) {
      return {};
    }

    return importEdges((node) => {
      const source = node.source.value;

      if (!isNativeSdk(source) || isTypeOnly(node)) {
        return;
      }

      context.report({
        node: node.source,
        messageId: "device",
        data: { source, segment: here.segment },
      });
    });
  },
};

export default nativeSdkSegment;
