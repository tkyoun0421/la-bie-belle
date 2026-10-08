import { QUERY_PACKAGE, QUERY_HOOKS, MUTATION_HOOKS } from "./queryHooks.mjs";
import {
  SERVICES_SEGMENT,
  fileLocation,
  specifierLocation,
} from "./segments.mjs";

const FEATURES_LAYER = "features";
const ENTITIES_LAYER = "entities";
const COMPOSITION_FLOOR = 2;

const READ_HOOKS = new Set(
  [...QUERY_HOOKS].filter((hook) => !MUTATION_HOOKS.has(hook)),
);

const featuresQueryComposes = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`features`의 읽기 service는 `entities` 도메인 둘 이상을 맞출 때만 선다.",
    },
    schema: [],
    messages: {
      readsAlone:
        "`features`는 use case를 든다. 도메인 하나를 읽는 일은 `entities/<도메인>/services/`가 가져라 — 이 파일이 맞추는 도메인이 {{count}}개다.",
    },
  },
  create(context) {
    const here = fileLocation(context);

    if (here?.layer !== FEATURES_LAYER || here.segment !== SERVICES_SEGMENT) {
      return {};
    }

    const domains = new Set();
    const reads = [];

    return {
      ImportDeclaration(node) {
        const specifier = node.source.value;
        const there = specifierLocation(specifier);

        if (there?.layer === ENTITIES_LAYER && there.slice) {
          domains.add(there.slice);
        }

        if (specifier !== QUERY_PACKAGE) {
          return;
        }

        for (const imported of node.specifiers) {
          if (
            imported.type === "ImportSpecifier" &&
            READ_HOOKS.has(imported.imported.name)
          ) {
            reads.push(imported);
          }
        }
      },

      "Program:exit"() {
        if (domains.size >= COMPOSITION_FLOOR) {
          return;
        }

        for (const node of reads) {
          context.report({
            node,
            messageId: "readsAlone",
            data: { count: domains.size },
          });
        }
      },
    };
  },
};

export default featuresQueryComposes;
