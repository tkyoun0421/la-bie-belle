import fs from "node:fs";
import path from "node:path";

import { globToRegExp } from "./glob.mjs";

const CONTRACT_RELATIVE_PATH = "config/fsd.json";
const UNIT_TEST_VALUES = ["exempt", "required"];
const RUNTIME_EXPORT_VALUES = [true, false, "constants"];

class ContractError extends Error {}

function fail(message) {
  throw new ContractError(`${CONTRACT_RELATIVE_PATH}: ${message}`);
}

function readSegment(name, raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    fail(`segments.${name}은 객체여야 합니다.`);
  }
  if (!UNIT_TEST_VALUES.includes(raw.unitTest)) {
    fail(`segments.${name}.unitTest는 exempt 또는 required여야 합니다.`);
  }
  if (!RUNTIME_EXPORT_VALUES.includes(raw.runtimeExports)) {
    fail(`segments.${name}.runtimeExports는 true, false 또는 "constants"여야 합니다.`);
  }
  if (raw.verifiedBy !== undefined && !Array.isArray(raw.verifiedBy)) {
    fail(`segments.${name}.verifiedBy는 배열이어야 합니다.`);
  }
  if (raw.forbidImports !== undefined && !Array.isArray(raw.forbidImports)) {
    fail(`segments.${name}.forbidImports는 배열이어야 합니다.`);
  }
  if (raw.requireServerOnly !== undefined && typeof raw.requireServerOnly !== "boolean") {
    fail(`segments.${name}.requireServerOnly는 불리언이어야 합니다.`);
  }
  if (raw.noLogic !== undefined && typeof raw.noLogic !== "boolean") {
    fail(`segments.${name}.noLogic은 불리언이어야 합니다.`);
  }

  return {
    name,
    unitTest: raw.unitTest,
    verifiedBy: raw.verifiedBy ?? [],
    runtimeExports: raw.runtimeExports,
    forbidImports: raw.forbidImports ?? [],
    requireServerOnly: raw.requireServerOnly ?? false,
    noLogic: raw.noLogic ?? false,
  };
}

function readAppLayer(raw) {
  const defaults = { unitTest: "required", exemptFiles: [] };

  if (raw === undefined) {
    return defaults;
  }
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    fail("appLayer는 객체여야 합니다.");
  }
  if (raw.unitTest !== undefined && !UNIT_TEST_VALUES.includes(raw.unitTest)) {
    fail("appLayer.unitTest는 exempt 또는 required여야 합니다.");
  }
  if (raw.exemptFiles !== undefined && !Array.isArray(raw.exemptFiles)) {
    fail("appLayer.exemptFiles는 배열이어야 합니다.");
  }

  return { ...defaults, ...raw };
}

const TEST_PLACEMENT_DEFAULTS = { directory: "__tests__", suffix: ".test" };

function readTestPlacement(raw) {
  if (raw === undefined) {
    return { ...TEST_PLACEMENT_DEFAULTS };
  }
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    fail("testPlacement는 객체여야 합니다.");
  }
  if (raw.directory !== undefined && typeof raw.directory !== "string") {
    fail("testPlacement.directory는 문자열이어야 합니다.");
  }
  if (raw.suffix !== undefined && typeof raw.suffix !== "string") {
    fail("testPlacement.suffix는 문자열이어야 합니다.");
  }

  return { ...TEST_PLACEMENT_DEFAULTS, ...raw };
}

function readNaming(raw) {
  const defaults = {
    folder: "kebab-case",
    file: "kebab-case",
    componentFile: "PascalCase",
    hookFile: "useCamelCase",
    exceptions: [],
  };

  if (raw === undefined) {
    return defaults;
  }
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    fail("naming은 객체여야 합니다.");
  }
  if (raw.exceptions !== undefined && !Array.isArray(raw.exceptions)) {
    fail("naming.exceptions는 배열이어야 합니다.");
  }

  return { ...defaults, ...raw };
}

export function parseContract(raw) {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    fail("계약은 객체여야 합니다.");
  }
  if (!Array.isArray(raw.layers) || raw.layers.length === 0) {
    fail("layers는 비어 있지 않은 배열이어야 합니다. 배열 순서가 의존 방향입니다.");
  }
  if (raw.segments === null || typeof raw.segments !== "object" || Array.isArray(raw.segments)) {
    fail("segments는 객체여야 합니다.");
  }
  if (raw.exemptPaths !== undefined && !Array.isArray(raw.exemptPaths)) {
    fail("exemptPaths는 배열이어야 합니다.");
  }

  const layers = raw.layers;
  const segments = new Map(
    Object.entries(raw.segments).map(([name, value]) => [name, readSegment(name, value)]),
  );
  const exemptMatchers = (raw.exemptPaths ?? []).map(globToRegExp);
  const appLayer = readAppLayer(raw.appLayer);
  const naming = readNaming(raw.naming);
  const testPlacement = readTestPlacement(raw.testPlacement);
  const namingExceptionMatchers = naming.exceptions.map(globToRegExp);

  const layerRank = (layer) => {
    const index = layers.indexOf(layer);
    return index === -1 ? null : index;
  };

  return {
    layers,
    appLayer,
    naming,
    testPlacement,
    segmentNames: [...segments.keys()],
    layerRank,
    canImport(fromLayer, toLayer) {
      const from = layerRank(fromLayer);
      const to = layerRank(toLayer);
      return from !== null && to !== null && from < to;
    },
    segment(name) {
      return segments.get(name) ?? null;
    },
    isExemptPath(relativePath) {
      return exemptMatchers.some((matcher) => matcher.test(relativePath));
    },
    appFileNeedsTest(fileName) {
      if (appLayer.unitTest === "exempt") {
        return false;
      }
      return !appLayer.exemptFiles.includes(fileName);
    },
    isNamingException(relativePath) {
      return namingExceptionMatchers.some((matcher) => matcher.test(relativePath));
    },
  };
}

export function loadContract(cwd) {
  const filePath = path.join(cwd, CONTRACT_RELATIVE_PATH);
  let text;

  try {
    text = fs.readFileSync(filePath, "utf-8");
  } catch {
    fail(`파일을 읽을 수 없습니다: ${filePath}`);
  }

  try {
    return parseContract(JSON.parse(text));
  } catch (error) {
    if (error instanceof ContractError) {
      throw error;
    }
    fail(`유효한 JSON이 아닙니다: ${error.message}`);
  }
}
