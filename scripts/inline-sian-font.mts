import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// 시안을 아티팩트로 올릴 때 Wanted Sans를 파일 안에 심는다.
//
// 저장소의 시안은 tokens.md의 「서체 연결」대로 jsdelivr 스타일시트를 <link>로 건다.
// 그런데 아티팩트는 외부 스타일시트를 fonts.googleapis.com에서만 받아서 그 <link>가
// 조용히 차단되고 시스템 서체로 떨어진다. Wanted Sans는 Google Fonts에 없다.
// 그래서 올릴 때만 그 <link>를 base64 @font-face로 바꾼 복사본을 만든다.
// 저장소에는 폰트 파일이 들어가지 않는다 — foundation/typography.md의 「서체」가 정한 것이다.
//
//   pnpm sian:inline <시안 경로> [출력 경로]
//
// 출력 경로를 안 주면 시안 이름 그대로 .artifact/ 아래에 쓴다.

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../..");
const SPLIT_CSS =
  "https://cdn.jsdelivr.net/gh/wanteddev/wanted-sans@v1.0.3/packages/wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.css";
const SPLIT_BASE = SPLIT_CSS.slice(0, SPLIT_CSS.lastIndexOf("/"));

const LINK_BLOCK =
  '<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin="anonymous">\n' +
  `<link rel="stylesheet" href="${SPLIT_CSS}">`;

type Face = { src: string; ranges: [number, number][]; block: string };

function parseFaces(css: string): Face[] {
  const faces: Face[] = [];
  for (const block of css.split("@font-face").slice(1)) {
    const body = block.slice(0, block.indexOf("}") + 1);
    const src = body.match(/url\("\.\/([^"]+)"\)/);
    const range = body.match(/unicode-range:\s*([^;]+);/);
    if (!src || !range) continue;
    const ranges = range[1].split(",").map((part): [number, number] => {
      const value = part.trim().replace(/^U\+/i, "");
      if (!value.includes("-")) {
        const one = Number.parseInt(value, 16);
        return [one, one];
      }
      const [from, to] = value.split("-");
      return [Number.parseInt(from, 16), Number.parseInt(to, 16)];
    });
    faces.push({ src: src[1], ranges, block: body });
  }
  return faces;
}

// 목업에 실제로 찍히는 글자만 센다. <style>과 <script> 안은 화면에 안 나온다.
function visibleChars(html: string): Set<number> {
  const stripped = html
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, " ");
  const out = new Set<number>();
  for (const ch of stripped) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined && cp >= 0x20) out.add(cp);
  }
  return out;
}

async function fetchOrDie(url: string): Promise<Response> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res;
}

const [input, output] = process.argv.slice(2);
if (!input) {
  console.error(
    "시안 경로가 필요하다 — pnpm sian:inline <시안 경로> [출력 경로]",
  );
  process.exit(1);
}

const sianPath = path.resolve(ROOT, input);
const html = readFileSync(sianPath, "utf8");
if (!html.includes(LINK_BLOCK)) {
  console.error(`jsdelivr <link>를 못 찾았다 — ${input}`);
  process.exit(1);
}

const css = await (await fetchOrDie(SPLIT_CSS)).text();
const faces = parseFaces(css);
const chars = visibleChars(html);

const needed = faces.filter((face) =>
  face.ranges.some(([from, to]) => {
    for (const cp of chars) if (cp >= from && cp <= to) return true;
    return false;
  }),
);

let bytes = 0;
const blocks: string[] = [];
for (const face of needed) {
  const buffer = Buffer.from(
    await (await fetchOrDie(`${SPLIT_BASE}/${face.src}`)).arrayBuffer(),
  );
  bytes += buffer.byteLength;
  const uri = `data:font/woff2;base64,${buffer.toString("base64")}`;
  blocks.push(face.block.replace(/url\("\.\/[^"]+"\)/, `url("${uri}")`));
}

const style = `<style>\n/* Wanted Sans — 아티팩트 CSP가 jsdelivr 스타일시트를 막아서 심었다. 저장소 시안은 <link>다. */\n@font-face${blocks.join("@font-face")}</style>`;
const outPath = output
  ? path.resolve(ROOT, output)
  : path.join(ROOT, ".artifact", path.basename(sianPath));

mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, html.replace(LINK_BLOCK, style));

const kb = (n: number) => `${Math.round(n / 1024)}KB`;
console.log(
  `${path.basename(sianPath)} → ${path.relative(ROOT, outPath)}  글자 ${chars.size}자, 조각 ${needed.length}개 ${kb(bytes)} (base64 약 ${kb(bytes * 1.37)})`,
);
