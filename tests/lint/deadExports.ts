import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { backlogRows, repositoryBacklog } from "@tests/lint/backlogIds";
import { type CodeFile, repositoryCodeFiles } from "@tests/lint/fileNaming";

const SOURCE_ROOT = "src/";

const APP_ROOT = "src/app/";

const OBSERVATION_PREFIX = "observations/";

const OBSERVATION_OPEN = "open";

const BACKLOG_DONE = "done";

const EXTENSIONS = [".ts", ".tsx", ".mts", ".mjs", ".js"];

const ALIASES = [
  { prefix: "@/", root: "src/" },
  { prefix: "@tests/", root: "tests/" },
  { prefix: "@scripts/", root: "scripts/" },
];

const MOCK_CALLS = new Set([
  "jest.mock",
  "jest.doMock",
  "jest.unstable_mockModule",
]);

const REQUIRE_CALLS = new Set(["jest.requireActual", "jest.requireMock"]);

const EDGE_SYNC_FILE = "scripts/syncEdgeShared.mts";

const GENERATED_FILES = new Set(["src/shared/api/databaseTypes.ts"]);

const READ_AS_TEXT = new Set([
  "src/entities/attendance/consts/attendance.const.ts:CHECK_IN_WINDOW_CLOSE_HOUR_KST",
]);

export const EXEMPT_TEST_ONLY_FILES: Record<string, string> = {
  "src/features/attendanceCheckin/api/checkIn.api.ts": "attendance-checkin",
  "src/entities/excuse/api/getMyExcuses.api.ts": "attendance-excuse",
  "src/features/excuse/api/decideExcuse.api.ts": "attendance-excuse",
  "src/features/excuse/api/submitExcuse.api.ts": "attendance-excuse",
  "src/entities/attendance/model/attendanceColumn.policy.ts":
    "attendance-excuse",
  "src/entities/attendance/model/communicationDelay.policy.ts":
    "attendance-excuse",
  "src/entities/attendance/utils/summarizeAttendanceStatuses.utils.ts":
    "attendance-excuse",
  "src/features/qrAdmin/api/setHallLocation.api.ts": "hall-location",
  "src/features/auth/lib/handleAuthCallback.lib.ts": "login-screen-native",
  "src/features/auth/utils/authRedirect.utils.ts": "login-screen-native",
  "src/shared/ui/DraggableSheet.tsx":
    "observations/028-sheet-handle-doc-and-piece-disagree",
};

export type DeadExport = { file: string; name: string };

export type ExemptionProblem = {
  file: string;
  kind: "unlisted" | "stale" | "unknown-row" | "closed-row";
  row?: string;
};

type Pulled = readonly string[] | "all";

type Reference = {
  specifier: string;
  names: Pulled;
  fromMock: boolean;
};

type Parsed = {
  references: Reference[];
  exports: string[];
  types: string[];
};

function scriptKindOf(file: string): ts.ScriptKind {
  return file.endsWith(".tsx") || file.endsWith(".jsx")
    ? ts.ScriptKind.TSX
    : ts.ScriptKind.TS;
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return (
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === kind)
  );
}

function importedName(element: ts.ImportSpecifier | ts.ExportSpecifier) {
  return (element.propertyName ?? element.name).text;
}

function bindingNames(name: ts.BindingName): string[] {
  if (ts.isIdentifier(name)) {
    return [name.text];
  }

  return name.elements.flatMap((element) =>
    ts.isOmittedExpression(element) ? [] : bindingNames(element.name),
  );
}

function destructuredFrom(call: ts.CallExpression): Pulled {
  const awaited = call.parent;

  if (!ts.isAwaitExpression(awaited)) {
    return "all";
  }

  const declaration = awaited.parent;

  if (
    !ts.isVariableDeclaration(declaration) ||
    !ts.isObjectBindingPattern(declaration.name)
  ) {
    return "all";
  }

  const elements = declaration.name.elements;

  if (elements.some((element) => element.dotDotDotToken !== undefined)) {
    return "all";
  }

  return elements.map((element) => {
    const named = element.propertyName ?? element.name;

    return ts.isIdentifier(named) || ts.isStringLiteral(named)
      ? named.text
      : "";
  });
}

function importReference(node: ts.ImportDeclaration): Reference | undefined {
  if (!ts.isStringLiteral(node.moduleSpecifier)) {
    return undefined;
  }

  const specifier = node.moduleSpecifier.text;
  const clause = node.importClause;

  if (clause === undefined) {
    return { specifier, names: [], fromMock: false };
  }

  const names: string[] = [];

  if (clause.name !== undefined) {
    names.push("default");
  }

  const bindings = clause.namedBindings;

  if (bindings !== undefined && ts.isNamespaceImport(bindings)) {
    return { specifier, names: "all", fromMock: false };
  }

  if (bindings !== undefined) {
    for (const element of bindings.elements) {
      names.push(importedName(element));
    }
  }

  return { specifier, names, fromMock: false };
}

function reexportReference(node: ts.ExportDeclaration): Reference | undefined {
  if (
    node.moduleSpecifier === undefined ||
    !ts.isStringLiteral(node.moduleSpecifier)
  ) {
    return undefined;
  }

  const specifier = node.moduleSpecifier.text;
  const clause = node.exportClause;

  if (clause === undefined || ts.isNamespaceExport(clause)) {
    return { specifier, names: "all", fromMock: false };
  }

  return {
    specifier,
    names: clause.elements.map(importedName),
    fromMock: false,
  };
}

function callReference(node: ts.CallExpression): Reference | undefined {
  const [first] = node.arguments;

  if (first === undefined || !ts.isStringLiteralLike(first)) {
    return undefined;
  }

  const specifier = first.text;

  if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
    return { specifier, names: destructuredFrom(node), fromMock: false };
  }

  const callee = node.expression.getText();

  if (MOCK_CALLS.has(callee)) {
    return { specifier, names: [], fromMock: true };
  }

  if (REQUIRE_CALLS.has(callee)) {
    return { specifier, names: "all", fromMock: false };
  }

  return undefined;
}

function declaredValueExports(node: ts.Statement): string[] {
  if (
    !hasModifier(node, ts.SyntaxKind.ExportKeyword) ||
    hasModifier(node, ts.SyntaxKind.DeclareKeyword) ||
    hasModifier(node, ts.SyntaxKind.DefaultKeyword)
  ) {
    return [];
  }

  if (ts.isVariableStatement(node)) {
    return node.declarationList.declarations.flatMap((declaration) =>
      bindingNames(declaration.name),
    );
  }

  if (
    (ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isEnumDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node)) &&
    node.name !== undefined
  ) {
    return [node.name.text];
  }

  return [];
}

function declaredTypeExports(node: ts.Statement): string[] {
  if (
    hasModifier(node, ts.SyntaxKind.ExportKeyword) &&
    (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node))
  ) {
    return [node.name.text];
  }

  return [];
}

function listedValueExports(node: ts.Statement): string[] {
  if (
    !ts.isExportDeclaration(node) ||
    node.moduleSpecifier !== undefined ||
    node.exportClause === undefined ||
    !ts.isNamedExports(node.exportClause)
  ) {
    return [];
  }

  return node.exportClause.elements.map((element) => element.name.text);
}

export function parseModule({ file, source }: CodeFile): Parsed {
  const tree = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKindOf(file),
  );
  const references: Reference[] = [];

  function visit(node: ts.Node): void {
    const found = ts.isImportDeclaration(node)
      ? importReference(node)
      : ts.isExportDeclaration(node)
        ? reexportReference(node)
        : ts.isCallExpression(node)
          ? callReference(node)
          : undefined;

    if (found !== undefined) {
      references.push(found);
    }

    ts.forEachChild(node, visit);
  }

  visit(tree);

  return {
    references,
    exports: tree.statements.flatMap((statement) => [
      ...declaredValueExports(statement),
      ...listedValueExports(statement),
    ]),
    types: tree.statements.flatMap(declaredTypeExports),
  };
}

export function isTestFile(file: string): boolean {
  return (
    file.startsWith("tests/") ||
    file.includes("/__tests__/") ||
    /\.test\.[mc]?[jt]sx?$/.test(file)
  );
}

function resolveSpecifier(
  specifier: string,
  from: string,
  known: ReadonlySet<string>,
): string | undefined {
  const alias = ALIASES.find(({ prefix }) => specifier.startsWith(prefix));
  const base = alias
    ? `${alias.root}${specifier.slice(alias.prefix.length)}`
    : specifier.startsWith(".")
      ? path.posix.join(path.posix.dirname(from), specifier)
      : undefined;

  if (base === undefined) {
    return undefined;
  }

  const candidates = [
    base,
    ...EXTENSIONS.map((extension) => `${base}${extension}`),
    ...EXTENSIONS.map((extension) => `${base}/index${extension}`),
  ];

  return candidates.find((candidate) => known.has(candidate));
}

type Pull = {
  names: Set<string>;
  all: boolean;
  production: boolean;
  tests: boolean;
};

function pullsOf(files: readonly CodeFile[]): Map<string, Pull> {
  const known = new Set(files.map(({ file }) => file));
  const pulls = new Map<string, Pull>();

  for (const entry of files) {
    const { references } = parseModule(entry);
    const fromProduction =
      entry.file.startsWith(SOURCE_ROOT) && !isTestFile(entry.file);

    for (const reference of references) {
      const target = resolveSpecifier(reference.specifier, entry.file, known);

      if (target === undefined || target === entry.file) {
        continue;
      }

      const pull = pulls.get(target) ?? {
        names: new Set<string>(),
        all: false,
        production: false,
        tests: false,
      };

      if (reference.names === "all") {
        pull.all = true;
      } else {
        reference.names.forEach((name) => pull.names.add(name));
      }

      if (fromProduction) {
        pull.production = true;
      } else if (isTestFile(entry.file)) {
        pull.tests = true;
      }

      pulls.set(target, pull);
    }
  }

  return pulls;
}

export function edgeSharedFolders(syncSource: string): string[] {
  return [...syncSource.matchAll(/from:\s*"(src\/[^"]+?)\/?"/g)].map(
    ([, folder]) => folder,
  );
}

function isOutOfScope(file: string, edgeFolders: readonly string[]): boolean {
  return (
    !file.startsWith(SOURCE_ROOT) ||
    isTestFile(file) ||
    file.startsWith(APP_ROOT) ||
    /(?:^|\/)index\.[mc]?[jt]sx?$/.test(file) ||
    GENERATED_FILES.has(file) ||
    edgeFolders.some((folder) => file.startsWith(`${folder}/`))
  );
}

function usedInOwnFile(source: string, name: string): boolean {
  return (source.match(new RegExp(`\\b${name}\\b`, "g")) ?? []).length > 1;
}

export function deadExports(
  files: readonly CodeFile[],
  edgeFolders: readonly string[] = [],
  waiting: ReadonlySet<string> = new Set(),
): DeadExport[] {
  const pulls = pullsOf(files);

  return files
    .filter(
      ({ file }) => !isOutOfScope(file, edgeFolders) && !waiting.has(file),
    )
    .flatMap((entry) => {
      const pull = pulls.get(entry.file);

      if (pull?.all) {
        return [];
      }

      const { exports, types } = parseModule(entry);

      return exports
        .filter(
          (name) =>
            !pull?.names.has(name) &&
            !READ_AS_TEXT.has(`${entry.file}:${name}`) &&
            !(types.includes(name) && usedInOwnFile(entry.source, name)),
        )
        .map((name) => ({ file: entry.file, name }));
    });
}

export function testOnlyFiles(
  files: readonly CodeFile[],
  edgeFolders: readonly string[] = [],
): string[] {
  const pulls = pullsOf(files);

  return files
    .filter(({ file }) => !isOutOfScope(file, edgeFolders))
    .filter(({ file }) => {
      const pull = pulls.get(file);

      return pull !== undefined && pull.tests && !pull.production;
    })
    .map(({ file }) => file)
    .sort();
}

export function unproducedFiles(
  files: readonly CodeFile[],
  edgeFolders: readonly string[] = [],
): Set<string> {
  const pulls = pullsOf(files);

  return new Set(
    files
      .filter(({ file }) => !isOutOfScope(file, edgeFolders))
      .filter(({ file }) => pulls.get(file)?.production !== true)
      .map(({ file }) => file),
  );
}

export type ExemptionRows = {
  openBacklogRows: ReadonlySet<string>;
  allBacklogRows: ReadonlySet<string>;
  openObservations: ReadonlySet<string>;
  allObservations: ReadonlySet<string>;
};

export function exemptionProblems(
  testOnly: readonly string[],
  unproduced: ReadonlySet<string>,
  exemptions: Readonly<Record<string, string>>,
  rows: ExemptionRows,
): ExemptionProblem[] {
  const problems: ExemptionProblem[] = [];

  for (const file of testOnly) {
    if (!(file in exemptions)) {
      problems.push({ file, kind: "unlisted" });
    }
  }

  for (const [file, row] of Object.entries(exemptions)) {
    if (!unproduced.has(file)) {
      problems.push({ file, kind: "stale", row });
      continue;
    }

    const isObservation = row.startsWith(OBSERVATION_PREFIX);
    const all = isObservation ? rows.allObservations : rows.allBacklogRows;
    const open = isObservation ? rows.openObservations : rows.openBacklogRows;

    if (!all.has(row)) {
      problems.push({ file, kind: "unknown-row", row });
    } else if (!open.has(row)) {
      problems.push({ file, kind: "closed-row", row });
    }
  }

  return problems;
}

export function describeDeadExport({ file, name }: DeadExport): string {
  return `${file}:${name}`;
}

export function describeExemptionProblem(problem: ExemptionProblem): string {
  const row = problem.row === undefined ? "" : ` (${problem.row})`;

  return `${problem.file}${row} — ${problem.kind}`;
}

function observationStatus(markdown: string): string | undefined {
  const head = /^---\n([\s\S]*?)\n---/.exec(markdown)?.[1];

  return head === undefined ? undefined : /^status:\s*(\S+)/m.exec(head)?.[1];
}

export function repositoryExemptionRows(
  root: string = process.cwd(),
): ExemptionRows {
  const { markdown, columns } = repositoryBacklog(root);
  const backlog = backlogRows(markdown, columns);
  const observationFiles = [
    ...new Set(Object.values(EXEMPT_TEST_ONLY_FILES)),
  ].filter((row) => row.startsWith(OBSERVATION_PREFIX));
  const observations = new Map<string, string | undefined>();

  for (const row of observationFiles) {
    try {
      observations.set(
        row,
        observationStatus(
          readFileSync(path.join(root, "docs", `${row}.md`), "utf8"),
        ),
      );
    } catch {
      continue;
    }
  }

  return {
    allBacklogRows: new Set(backlog.map((row) => row.id)),
    openBacklogRows: new Set(
      backlog.filter((row) => row.status !== BACKLOG_DONE).map((row) => row.id),
    ),
    allObservations: new Set(observations.keys()),
    openObservations: new Set(
      [...observations]
        .filter(([, status]) => status === OBSERVATION_OPEN)
        .map(([row]) => row),
    ),
  };
}

export function repositoryEdgeFolders(root: string = process.cwd()): string[] {
  return edgeSharedFolders(
    readFileSync(path.join(root, EDGE_SYNC_FILE), "utf8"),
  );
}

export function repositoryDeadExports(root: string = process.cwd()) {
  const files = repositoryCodeFiles(root);
  const edgeFolders = repositoryEdgeFolders(root);
  const waiting = new Set(Object.keys(EXEMPT_TEST_ONLY_FILES));

  return {
    dead: deadExports(files, edgeFolders, waiting),
    testOnly: testOnlyFiles(files, edgeFolders),
    unproduced: unproducedFiles(files, edgeFolders),
  };
}
