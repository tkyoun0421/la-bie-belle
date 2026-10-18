import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { GOOGLE_BUTTON_ASSETS } from "@/screens/login/consts/login.const";

export type AssetViolation = {
  file: string;
  reference: string;
  kind: "missing-file" | "missing-directory";
};

export const GOOGLE_ASSET_DIR = "assets/google";

export const NOT_YET_DELIVERED_DIRS = ["assets/illustrations"];

const ASSET_EXTENSIONS = "png|jpe?g|gif|webp|svg|ttf|otf";

const FILE_REFERENCE = new RegExp(
  `(?:require\\(|from\\s|import\\s)\\s*["'](\\.{1,2}/[^"']+\\.(?:${ASSET_EXTENSIONS}))["']`,
  "g",
);

const CONTEXT_REFERENCE = /require\.context\(\s*["']([^"']+)["']/g;

export function assetViolations(
  file: string,
  source: string,
  root: string = process.cwd(),
): AssetViolation[] {
  const dir = path.dirname(path.resolve(root, file));
  const violations: AssetViolation[] = [];

  for (const match of source.matchAll(FILE_REFERENCE)) {
    const reference = match[1];

    if (!existsSync(path.resolve(dir, reference))) {
      violations.push({ file, reference, kind: "missing-file" });
    }
  }

  for (const match of source.matchAll(CONTEXT_REFERENCE)) {
    const reference = match[1];

    if (!existsSync(path.resolve(dir, reference))) {
      violations.push({ file, reference, kind: "missing-directory" });
    }
  }

  return violations;
}

function isShippedSource(file: string): boolean {
  return (
    /\.(?:ts|tsx)$/.test(file) &&
    !file.split(path.sep).includes("__tests__") &&
    !/\.(?:test|d)\.ts$/.test(file)
  );
}

function shippedFiles(root: string, relative: string): string[] {
  return readdirSync(path.join(root, relative), {
    withFileTypes: true,
  }).flatMap((entry) => {
    const next = path.join(relative, entry.name);

    if (entry.isDirectory()) {
      return shippedFiles(root, next);
    }

    return isShippedSource(next) ? [next] : [];
  });
}

function isNotYetDelivered(violation: AssetViolation, root: string): boolean {
  const target = path.relative(
    root,
    path.resolve(root, path.dirname(violation.file), violation.reference),
  );

  return (
    violation.kind === "missing-directory" &&
    NOT_YET_DELIVERED_DIRS.includes(target)
  );
}

export function repositoryAssetViolations(
  root: string = process.cwd(),
): AssetViolation[] {
  return shippedFiles(root, "src")
    .flatMap((file) =>
      assetViolations(file, readFileSync(path.join(root, file), "utf8"), root),
    )
    .filter((violation) => !isNotYetDelivered(violation, root));
}

export function googleButtonAssetNames(): string[] {
  return Object.values(GOOGLE_BUTTON_ASSETS).flatMap((byScheme) =>
    Object.values(byScheme),
  );
}

export function missingGoogleButtonAssets(
  names: readonly string[],
  root: string = process.cwd(),
): string[] {
  return names.filter(
    (name) => !existsSync(path.join(root, GOOGLE_ASSET_DIR, name)),
  );
}
