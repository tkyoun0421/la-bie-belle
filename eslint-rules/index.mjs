import constsSegment from "./constsSegment.mjs";
import controllerTypeNotGeneric from "./controllerTypeNotGeneric.mjs";
import dtoSegment from "./dtoSegment.mjs";
import dumbUi from "./dumbUi.mjs";
import entitiesReadOnly from "./entitiesReadOnly.mjs";
import envInConfig from "./envInConfig.mjs";
import featuresQueryComposes from "./featuresQueryComposes.mjs";
import fragmentStateContract from "./fragmentStateContract.mjs";
import hooksExportUseOnly from "./hooksExportUseOnly.mjs";
import mutationSettleShape from "./mutationSettleShape.mjs";
import nativeSdkSegment from "./nativeSdkSegment.mjs";
import noApiImportInUi from "./noApiImportInUi.mjs";
import noArbitraryClassValues from "./noArbitraryClassValues.mjs";
import noColorLiterals from "./noColorLiterals.mjs";
import noCrossSliceImport from "./noCrossSliceImport.mjs";
import noDefaultPaletteClass from "./noDefaultPaletteClass.mjs";
import noDuplicateFailureCopy from "./noDuplicateFailureCopy.mjs";
import noEdgeFunctionSrcImport from "./noEdgeFunctionSrcImport.mjs";
import noExplanatoryComment from "./noExplanatoryComment.mjs";
import noLayerReexport from "./noLayerReexport.mjs";
import noNodeImportInEdgeShared from "./noNodeImportInEdgeShared.mjs";
import noRoutePathLiteral from "./noRoutePathLiteral.mjs";
import noServicesImportInUi from "./noServicesImportInUi.mjs";
import noSnakeCaseField from "./noSnakeCaseField.mjs";
import noSupabaseInstanceInUi from "./noSupabaseInstanceInUi.mjs";
import noVisualUtilityClass from "./noVisualUtilityClass.mjs";
import purePolicy from "./purePolicy.mjs";
import queryHookInServices from "./queryHookInServices.mjs";
import queryKeyFactory from "./queryKeyFactory.mjs";
import servicesNoHooksImport from "./servicesNoHooksImport.mjs";
import storeFactoryInStores from "./storeFactoryInStores.mjs";
import supabasePackageInApi from "./supabasePackageInApi.mjs";
import typeFileNoRuntime from "./typeFileNoRuntime.mjs";
import typeGuardName from "./typeGuardName.mjs";
import uiNoRouter from "./uiNoRouter.mjs";
import uiValueImport from "./uiValueImport.mjs";
import useExportSegment from "./useExportSegment.mjs";

const house = {
  meta: { name: "eslint-plugin-house" },
  rules: {
    "consts-segment": constsSegment,
    "controller-type-not-generic": controllerTypeNotGeneric,
    "dto-segment": dtoSegment,
    "dumb-ui": dumbUi,
    "entities-read-only": entitiesReadOnly,
    "env-in-config": envInConfig,
    "features-query-composes": featuresQueryComposes,
    "fragment-state-contract": fragmentStateContract,
    "hooks-export-use-only": hooksExportUseOnly,
    "mutation-settle-shape": mutationSettleShape,
    "native-sdk-segment": nativeSdkSegment,
    "no-api-import-in-ui": noApiImportInUi,
    "no-arbitrary-class-values": noArbitraryClassValues,
    "no-color-literals": noColorLiterals,
    "no-cross-slice-import": noCrossSliceImport,
    "no-default-palette-class": noDefaultPaletteClass,
    "no-duplicate-failure-copy": noDuplicateFailureCopy,
    "no-edge-function-src-import": noEdgeFunctionSrcImport,
    "no-explanatory-comment": noExplanatoryComment,
    "no-layer-reexport": noLayerReexport,
    "no-node-import-in-edge-shared": noNodeImportInEdgeShared,
    "no-route-path-literal": noRoutePathLiteral,
    "no-services-import-in-ui": noServicesImportInUi,
    "no-snake-case-field": noSnakeCaseField,
    "no-supabase-instance-in-ui": noSupabaseInstanceInUi,
    "no-visual-utility-class": noVisualUtilityClass,
    "pure-policy": purePolicy,
    "query-hook-in-services": queryHookInServices,
    "query-key-factory": queryKeyFactory,
    "services-no-hooks-import": servicesNoHooksImport,
    "store-factory-in-stores": storeFactoryInStores,
    "supabase-package-in-api": supabasePackageInApi,
    "type-file-no-runtime": typeFileNoRuntime,
    "type-guard-name": typeGuardName,
    "ui-no-router": uiNoRouter,
    "ui-value-import": uiValueImport,
    "use-export-segment": useExportSegment,
  },
};

export default house;
