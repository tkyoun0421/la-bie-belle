import dumbUi from "./dumbUi.mjs";
import noArbitraryClassValues from "./noArbitraryClassValues.mjs";
import noColorLiterals from "./noColorLiterals.mjs";
import noCrossSliceImport from "./noCrossSliceImport.mjs";
import noDefaultPaletteClass from "./noDefaultPaletteClass.mjs";
import noEdgeFunctionSrcImport from "./noEdgeFunctionSrcImport.mjs";
import noNodeImportInEdgeShared from "./noNodeImportInEdgeShared.mjs";
import noVisualUtilityClass from "./noVisualUtilityClass.mjs";

/**
 * 규칙 이름은 kebab으로 둔다. ESLint 생태계가 그 꼴이고 소스의
 * `eslint-disable house/dumb-ui` 주석이 그 이름을 그대로 쓴다 —
 * 파일 이름을 camel로 옮긴 ADR-015는 규칙 이름까지는 안 건드렸다.
 */
const house = {
  meta: { name: "eslint-plugin-house" },
  rules: {
    "dumb-ui": dumbUi,
    "no-arbitrary-class-values": noArbitraryClassValues,
    "no-color-literals": noColorLiterals,
    "no-cross-slice-import": noCrossSliceImport,
    "no-default-palette-class": noDefaultPaletteClass,
    "no-edge-function-src-import": noEdgeFunctionSrcImport,
    "no-node-import-in-edge-shared": noNodeImportInEdgeShared,
    "no-visual-utility-class": noVisualUtilityClass,
  },
};

export default house;
