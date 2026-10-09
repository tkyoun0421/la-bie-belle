import constsSegment from "./constsSegment.mjs";
import dtoSegment from "./dtoSegment.mjs";
import dumbUi from "./dumbUi.mjs";
import entitiesReadOnly from "./entitiesReadOnly.mjs";
import envInConfig from "./envInConfig.mjs";
import featuresQueryComposes from "./featuresQueryComposes.mjs";
import nativeSdkSegment from "./nativeSdkSegment.mjs";
import noApiImportInUi from "./noApiImportInUi.mjs";
import noArbitraryClassValues from "./noArbitraryClassValues.mjs";
import noColorLiterals from "./noColorLiterals.mjs";
import noCrossSliceImport from "./noCrossSliceImport.mjs";
import noDefaultPaletteClass from "./noDefaultPaletteClass.mjs";
import noEdgeFunctionSrcImport from "./noEdgeFunctionSrcImport.mjs";
import noExplanatoryComment from "./noExplanatoryComment.mjs";
import noNodeImportInEdgeShared from "./noNodeImportInEdgeShared.mjs";
import noServicesImportInUi from "./noServicesImportInUi.mjs";
import noSnakeCaseField from "./noSnakeCaseField.mjs";
import noSupabaseInstanceInUi from "./noSupabaseInstanceInUi.mjs";
import noVisualUtilityClass from "./noVisualUtilityClass.mjs";
import purePolicy from "./purePolicy.mjs";
import queryHookInServices from "./queryHookInServices.mjs";
import queryKeyFactory from "./queryKeyFactory.mjs";
import storeFactoryInStores from "./storeFactoryInStores.mjs";
import supabasePackageInApi from "./supabasePackageInApi.mjs";
import uiValueImport from "./uiValueImport.mjs";
import useExportSegment from "./useExportSegment.mjs";

const house = {
  meta: { name: "eslint-plugin-house" },
  rules: {
    "consts-segment": constsSegment,
    "dto-segment": dtoSegment,
    "dumb-ui": dumbUi,
    "entities-read-only": entitiesReadOnly,
    "env-in-config": envInConfig,
    "features-query-composes": featuresQueryComposes,
    "native-sdk-segment": nativeSdkSegment,
    "no-api-import-in-ui": noApiImportInUi,
    "no-arbitrary-class-values": noArbitraryClassValues,
    "no-color-literals": noColorLiterals,
    "no-cross-slice-import": noCrossSliceImport,
    "no-default-palette-class": noDefaultPaletteClass,
    "no-edge-function-src-import": noEdgeFunctionSrcImport,
    "no-explanatory-comment": noExplanatoryComment,
    "no-node-import-in-edge-shared": noNodeImportInEdgeShared,
    "no-services-import-in-ui": noServicesImportInUi,
    "no-snake-case-field": noSnakeCaseField,
    "no-supabase-instance-in-ui": noSupabaseInstanceInUi,
    "no-visual-utility-class": noVisualUtilityClass,
    "pure-policy": purePolicy,
    "query-hook-in-services": queryHookInServices,
    "query-key-factory": queryKeyFactory,
    "store-factory-in-stores": storeFactoryInStores,
    "supabase-package-in-api": supabasePackageInApi,
    "ui-value-import": uiValueImport,
    "use-export-segment": useExportSegment,
  },
};

export default house;
