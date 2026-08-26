import path from "node:path";
import { ESLint } from "eslint";

export type Violation = { ruleId: string; line: number; message: string };

const overrideConfigFile = "eslint.config.mjs";

const reporter = new ESLint({ overrideConfigFile });
const fixer = new ESLint({ overrideConfigFile, fix: true });

function resolveFixturePath(filePath: string) {
  return path.join(process.cwd(), filePath);
}

await reporter.calculateConfigForFile(resolveFixturePath("src/warm-up.tsx"));

export async function violationsOf(
  code: string,
  filePath: string,
): Promise<Violation[]> {
  const [result] = await reporter.lintText(code, {
    filePath: resolveFixturePath(filePath),
  });

  return result.messages.map((message) => ({
    ruleId: message.ruleId ?? "",
    line: message.line,
    message: message.message,
  }));
}

export async function fixedCode(
  code: string,
  filePath: string,
): Promise<string> {
  const [result] = await fixer.lintText(code, {
    filePath: resolveFixturePath(filePath),
  });

  return result.output ?? code;
}
