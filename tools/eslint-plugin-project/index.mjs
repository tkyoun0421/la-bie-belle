import fileNaming from "./rules/file-naming.mjs";
import layerDirection from "./rules/layer-direction.mjs";
import noComments from "./rules/no-comments.mjs";
import noRuntimeExport from "./rules/no-runtime-export.mjs";
import requireServerOnly from "./rules/require-server-only.mjs";
import segmentImports from "./rules/segment-imports.mjs";
import segmentName from "./rules/segment-name.mjs";

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
  },
};
