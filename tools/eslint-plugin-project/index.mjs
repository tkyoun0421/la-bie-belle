import designTokenColors from "./rules/design-token-colors.mjs";
import errorCodeLiteral from "./rules/error-code-literal.mjs";
import fileNaming from "./rules/file-naming.mjs";
import importAlias from "./rules/import-alias.mjs";
import layerDirection from "./rules/layer-direction.mjs";
import motionTokens from "./rules/motion-tokens.mjs";
import noComments from "./rules/no-comments.mjs";
import noRuntimeExport from "./rules/no-runtime-export.mjs";
import requireServerOnly from "./rules/require-server-only.mjs";
import segmentImports from "./rules/segment-imports.mjs";
import segmentName from "./rules/segment-name.mjs";
import testPlacement from "./rules/test-placement.mjs";

export default {
  meta: { name: "eslint-plugin-project", version: "1.0.0" },
  rules: {
    "layer-direction": layerDirection,
    "segment-name": segmentName,
    "segment-imports": segmentImports,
    "no-runtime-export": noRuntimeExport,
    "require-server-only": requireServerOnly,
    "file-naming": fileNaming,
    "no-comments": noComments,
    "error-code-literal": errorCodeLiteral,
    "import-alias": importAlias,
    "test-placement": testPlacement,
    "design-token-colors": designTokenColors,
    "motion-tokens": motionTokens,
  },
};
