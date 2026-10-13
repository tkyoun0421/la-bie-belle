const TYPE_FILE = ".type.ts";
const DTO_FILE = ".dto.ts";
const TOP_LEVEL_PARENTS = new Set([
  "Program",
  "ExportNamedDeclaration",
  "ExportDefaultDeclaration",
]);
const FUNCTION_VALUES = new Set([
  "ArrowFunctionExpression",
  "FunctionExpression",
]);

function isTopLevel(node) {
  return TOP_LEVEL_PARENTS.has(node.parent?.type);
}

function holdsFunction(declaration) {
  return declaration.declarations.some((declarator) =>
    FUNCTION_VALUES.has(declarator.init?.type),
  );
}

const typeFileNoRuntime = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`.type.ts`에 클래스·변수·함수 선언을, `.dto.ts`에 클래스·함수 선언을 막는다. `.dto.ts`의 열 목록 상수는 통과한다.",
    },
    schema: [],
    messages: {
      typeRuntime:
        "`.type.ts`는 런타임에 아무것도 안 하는 파일이다. 클래스·변수·함수는 값을 내니 성격이 맞는 자리로 옮겨라 — 판정은 `.policy.ts`, 정해진 값은 `consts/`, 맞는 접미사가 없으면 접미사 없는 파일이다.",
      dtoRuntime:
        "`.dto.ts`는 통신이 주고받는 꼴과 질의할 열 목록만 든다. 클래스와 함수는 `api/`의 `.api.ts`나 `utils/`의 `.mapper.ts`로 옮겨라.",
    },
  },
  create(context) {
    const isTypeFile = context.filename.endsWith(TYPE_FILE);
    const isDtoFile = context.filename.endsWith(DTO_FILE);

    if (!isTypeFile && !isDtoFile) {
      return {};
    }

    const messageId = isTypeFile ? "typeRuntime" : "dtoRuntime";

    function report(node) {
      if (isTopLevel(node) && !node.declare) {
        context.report({ node, messageId });
      }
    }

    return {
      ClassDeclaration: report,
      FunctionDeclaration: report,
      VariableDeclaration(node) {
        if (isTypeFile || holdsFunction(node)) {
          report(node);
        }
      },
    };
  },
};

export default typeFileNoRuntime;
