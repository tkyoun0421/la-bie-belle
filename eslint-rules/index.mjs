import dumbUi from "./dumbUi.mjs";
import noApiImportInUi from "./noApiImportInUi.mjs";
import noArbitraryClassValues from "./noArbitraryClassValues.mjs";
import noColorLiterals from "./noColorLiterals.mjs";
import noCrossSliceImport from "./noCrossSliceImport.mjs";
import noDefaultPaletteClass from "./noDefaultPaletteClass.mjs";
import noEdgeFunctionSrcImport from "./noEdgeFunctionSrcImport.mjs";
import noNodeImportInEdgeShared from "./noNodeImportInEdgeShared.mjs";
import noServicesImportInUi from "./noServicesImportInUi.mjs";
import noSupabaseInstanceInUi from "./noSupabaseInstanceInUi.mjs";
import noVisualUtilityClass from "./noVisualUtilityClass.mjs";
import queryHookInServices from "./queryHookInServices.mjs";
import supabasePackageInApi from "./supabasePackageInApi.mjs";

/**
 * 규칙 이름은 kebab으로 둔다. ESLint 생태계가 그 꼴이고 소스의
 * `eslint-disable house/dumb-ui` 주석이 그 이름을 그대로 쓴다 —
 * 파일 이름을 camel로 옮긴 ADR-015는 규칙 이름까지는 안 건드렸다.
 */
const house = {
  meta: { name: "eslint-plugin-house" },
  rules: {
    "dumb-ui": dumbUi,
    "no-api-import-in-ui": noApiImportInUi,
    "no-arbitrary-class-values": noArbitraryClassValues,
    "no-color-literals": noColorLiterals,
    "no-cross-slice-import": noCrossSliceImport,
    "no-default-palette-class": noDefaultPaletteClass,
    "no-edge-function-src-import": noEdgeFunctionSrcImport,
    "no-node-import-in-edge-shared": noNodeImportInEdgeShared,
    "no-services-import-in-ui": noServicesImportInUi,
    "no-supabase-instance-in-ui": noSupabaseInstanceInUi,
    "no-visual-utility-class": noVisualUtilityClass,
    "query-hook-in-services": queryHookInServices,
    "supabase-package-in-api": supabasePackageInApi,
  },
};

export default house;
