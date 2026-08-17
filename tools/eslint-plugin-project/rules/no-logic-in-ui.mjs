import { loadContract } from "../lib/contract.mjs";
import { globToRegExp } from "../lib/glob.mjs";
import { resolveLocation } from "../lib/resolve-path.mjs";

const TEST_DIRECTORY_PATTERN = globToRegExp("**/__tests__/**");
const MOCK_FILE_PATTERN = globToRegExp("**/*.mock.ts");

const COMPARISON_OPERATORS = new Set(["<", ">", "<=", ">="]);
const ARITHMETIC_BINARY_OPERATORS = new Set(["-", "*", "/", "%"]);
const DERIVED_ARRAY_METHODS = new Set([
  "filter",
  "reduce",
  "sort",
  "slice",
  "find",
  "some",
  "every",
  "flatMap",
  "map",
]);
const DATE_OR_FORMAT_MEMBERS = new Set(["toLocaleString", "toLocaleDateString", "toFixed"]);

const JSX_PASSTHROUGH_ANCESTORS = new Set([
  "LogicalExpression",
  "ConditionalExpression",
  "ArrayExpression",
  "JSXElement",
  "JSXFragment",
]);

function isRenderedInJsx(node) {
  let current = node.parent;

  while (current !== undefined && current !== null) {
    if (current.type === "JSXExpressionContainer") {
      return true;
    }
    if (!JSX_PASSTHROUGH_ANCESTORS.has(current.type)) {
      return false;
    }
    current = current.parent;
  }

  return false;
}

function isExemptFile(relativePath) {
  return TEST_DIRECTORY_PATTERN.test(relativePath) || MOCK_FILE_PATTERN.test(relativePath);
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "ui 세그먼트에서 판정·계산·목록 파생·시각/포맷 계산을 금지한다 (P0-T48 AC17~20, DEV-CODE-09).",
    },
    messages: {
      comparisonOperator:
        "ui 세그먼트는 비교 연산자(<, >, <=, >=)를 쓸 수 없습니다. model이 판정한 값을 받으세요.",
      arithmeticOperation:
        "ui 세그먼트는 산술 연산을 쓸 수 없습니다. model이 계산한 값을 받으세요.",
      lengthAccess:
        "ui 세그먼트는 .length에 접근할 수 없습니다. model이 판정한 값을 받으세요.",
      derivedArrayMethod:
        "ui 세그먼트는 목록을 파생시키는 배열 메서드를 쓸 수 없습니다. model이 만든 목록을 받으세요.",
      dateOrFormatCall:
        "ui 세그먼트는 시각·포맷 계산을 할 수 없습니다. model이 만든 문자열을 받으세요.",
    },
    schema: [],
  },
  create(context) {
    const contract = loadContract(context.cwd);
    const location = resolveLocation(context.filename, context.cwd);

    if (location === null || location.segment === null) {
      return {};
    }
    if (contract.isExemptPath(location.relative) || isExemptFile(location.relative)) {
      return {};
    }

    const definition = contract.segment(location.segment);
    if (definition === null || !definition.noLogic) {
      return {};
    }

    return {
      BinaryExpression(node) {
        if (COMPARISON_OPERATORS.has(node.operator)) {
          context.report({ node, messageId: "comparisonOperator" });
          return;
        }
        if (ARITHMETIC_BINARY_OPERATORS.has(node.operator)) {
          context.report({ node, messageId: "arithmeticOperation" });
        }
      },
      UnaryExpression(node) {
        if (node.operator === "-") {
          context.report({ node, messageId: "arithmeticOperation" });
        }
      },
      MemberExpression(node) {
        if (!node.computed && node.property.type === "Identifier" && node.property.name === "length") {
          context.report({ node, messageId: "lengthAccess" });
        }
      },
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== "MemberExpression" || callee.computed || callee.property.type !== "Identifier") {
          return;
        }

        const name = callee.property.name;

        if (callee.object.type === "Identifier" && callee.object.name === "Date" && name === "now") {
          context.report({ node, messageId: "dateOrFormatCall" });
          return;
        }
        if (callee.object.type === "Identifier" && callee.object.name === "Intl") {
          context.report({ node, messageId: "dateOrFormatCall" });
          return;
        }
        if (DATE_OR_FORMAT_MEMBERS.has(name)) {
          context.report({ node, messageId: "dateOrFormatCall" });
          return;
        }
        if (DERIVED_ARRAY_METHODS.has(name)) {
          if (name === "map" && isRenderedInJsx(node)) {
            return;
          }
          context.report({ node, messageId: "derivedArrayMethod" });
        }
      },
      NewExpression(node) {
        const callee = node.callee;
        if (callee.type === "Identifier" && callee.name === "Date") {
          context.report({ node, messageId: "dateOrFormatCall" });
          return;
        }
        if (
          callee.type === "MemberExpression" &&
          !callee.computed &&
          callee.object.type === "Identifier" &&
          callee.object.name === "Intl"
        ) {
          context.report({ node, messageId: "dateOrFormatCall" });
        }
      },
    };
  },
};
