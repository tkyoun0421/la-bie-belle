import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Runs every gate self-test in one process. Importing the files directly keeps
 * the run independent of the test runner's file discovery patterns, which do not
 * cover TypeScript on this Node version.
 */
const selfTestDirectory = dirname(fileURLToPath(import.meta.url));
const testFiles = readdirSync(selfTestDirectory)
  .filter((fileName) => fileName.endsWith(".test.ts"))
  .sort();

for (const fileName of testFiles) {
  await import(pathToFileURL(join(selfTestDirectory, fileName)).href);
}
