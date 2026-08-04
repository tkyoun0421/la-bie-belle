import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const selfTestDirectory = dirname(fileURLToPath(import.meta.url));
const testFiles = readdirSync(selfTestDirectory)
  .filter((fileName) => fileName.endsWith(".test.ts"))
  .sort();

for (const fileName of testFiles) {
  await import(pathToFileURL(join(selfTestDirectory, fileName)).href);
}
