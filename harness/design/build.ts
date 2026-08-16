import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import tailwindcssPostcss from "@tailwindcss/postcss";
import postcss from "postcss";
import { resolveRepoRoot } from "../lib/repo.ts";

const GLOBALS_CSS_PATH = "src/app/globals.css";
const FONT_PATH = "src/shared/config/fonts/WantedSansVariable.woff2";
const FONT_FAMILY = "Wanted Sans Variable";
const FONT_VARIABLE = "--font-wanted-sans";
const SOURCE_DIRECTIVE_PATTERN = /@source\s+"[^"]*";/;

type BuildArgs = {
  readonly inputPath: string;
  readonly outputPath: string;
};

function defaultOutputPath(inputPath: string): string {
  const extension = extname(inputPath);
  const name = basename(inputPath, extension);
  return join(dirname(inputPath), `${name}.inlined.html`);
}

function parseArgs(argv: readonly string[]): BuildArgs | null {
  const inputArg = argv[0];
  if (inputArg === undefined) {
    return null;
  }
  const inputPath = resolve(inputArg);

  let outputArg: string | null = null;
  for (let index = 1; index < argv.length; index += 1) {
    if (argv[index] === "--out") {
      outputArg = argv[index + 1] ?? null;
      break;
    }
  }

  const outputPath = outputArg === null ? defaultOutputPath(inputPath) : resolve(outputArg);
  return { inputPath, outputPath };
}

function buildEntryCss(root: string, inputPath: string): string {
  const globalsCss = readFileSync(join(root, GLOBALS_CSS_PATH), "utf8");
  return globalsCss.replace(SOURCE_DIRECTIVE_PATTERN, `@source "${inputPath}";`);
}

function buildFontFaceCss(root: string): string {
  const fontBase64 = readFileSync(join(root, FONT_PATH)).toString("base64");
  return [
    "@font-face {",
    `  font-family: "${FONT_FAMILY}";`,
    `  src: url("data:font/woff2;base64,${fontBase64}") format("woff2-variations");`,
    "  font-weight: 100 900;",
    "  font-display: swap;",
    "}",
  ].join("\n");
}

function buildFontVariableCss(): string {
  return [":root {", `  ${FONT_VARIABLE}: "${FONT_FAMILY}";`, "}"].join("\n");
}

function injectStyle(html: string, css: string): string {
  const styleBlock = `<style>\n${css}\n</style>`;
  if (html.includes("</head>")) {
    return html.replace("</head>", `${styleBlock}\n</head>`);
  }
  return html.replace("<body", `${styleBlock}\n<body`);
}

async function run(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (args === null) {
    process.stderr.write("harness/design/build.ts: 입력 HTML 경로가 필요합니다.\n");
    return 1;
  }

  const { inputPath, outputPath } = args;
  if (!existsSync(inputPath)) {
    process.stderr.write(`harness/design/build.ts: 입력 파일을 찾을 수 없습니다: ${inputPath}\n`);
    return 1;
  }
  if (extname(inputPath) !== ".html") {
    process.stderr.write("harness/design/build.ts: 입력 파일은 .html 확장자여야 합니다.\n");
    return 1;
  }

  const root = resolveRepoRoot();
  const entryCss = buildEntryCss(root, inputPath);
  const result = await postcss([tailwindcssPostcss({ base: root })]).process(entryCss, {
    from: join(root, GLOBALS_CSS_PATH),
  });
  result.root.walkComments((comment) => {
    comment.remove();
  });

  const css = [buildFontFaceCss(root), result.root.toString(), buildFontVariableCss()].join("\n\n");
  const html = readFileSync(inputPath, "utf8");
  writeFileSync(outputPath, injectStyle(html, css));
  return 0;
}

process.exitCode = await run();
