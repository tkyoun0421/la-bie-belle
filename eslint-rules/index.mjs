import dumbUi from "./dumbUi.mjs";
import entitiesReadOnly from "./entitiesReadOnly.mjs";
import featuresQueryComposes from "./featuresQueryComposes.mjs";
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

const house = {
  meta: { name: "eslint-plugin-house" },
  rules: {
    "dumb-ui": dumbUi,
    "entities-read-only": entitiesReadOnly,
    "features-query-composes": featuresQueryComposes,
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
