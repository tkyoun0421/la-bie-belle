import {
  UI_SEGMENT,
  fileLocation,
  importEdges,
  isTypeOnly,
} from "./segments.mjs";

const ROUTER_PACKAGE = "expo-router";
const NAVIGATION_HOOKS = new Set([
  "useRouter",
  "usePathname",
  "useLocalSearchParams",
  "useGlobalSearchParams",
  "useSegments",
  "useNavigation",
]);

const uiNoRouter = {
  meta: {
    type: "problem",
    docs: {
      description: "`ui/*.tsx`는 갈 데를 고르지 않는다. 경로는 받는다.",
    },
    schema: [],
    messages: {
      routerInUi:
        "'{{hook}}' 를 조각이 쥐면 그 조각이 어디 사는지를 아는 것이다. 갈 데는 controller가 정해 `onPress`로 내려줘라 — 같은 조각이 화면마다 다른 데로 보낸다.",
    },
  },
  create(context) {
    if (fileLocation(context)?.segment !== UI_SEGMENT) {
      return {};
    }

    return importEdges((node) => {
      if (node.source.value !== ROUTER_PACKAGE || isTypeOnly(node)) {
        return;
      }

      for (const specifier of node.specifiers ?? []) {
        if (
          specifier.type === "ImportSpecifier" &&
          specifier.importKind !== "type" &&
          NAVIGATION_HOOKS.has(specifier.imported.name)
        ) {
          context.report({
            node: specifier,
            messageId: "routerInUi",
            data: { hook: specifier.imported.name },
          });
        }
      }
    });
  },
};

export default uiNoRouter;
