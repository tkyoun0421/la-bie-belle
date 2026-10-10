const SETTLE_CALLBACK = "onSuccess";

const CACHE_METHOD = "invalidateQueries";

const LOOPS = new Set([
  "ForStatement",
  "ForInStatement",
  "ForOfStatement",
  "WhileStatement",
  "DoWhileStatement",
]);

const FUNCTIONS = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

function propertyNameOf(node) {
  if (node.computed) {
    return null;
  }

  if (node.key.type === "Identifier") {
    return node.key.name;
  }

  return node.key.type === "Literal" ? node.key.value : null;
}

function childrenOf(node) {
  const children = [];

  for (const key of Object.keys(node)) {
    if (key === "parent") {
      continue;
    }

    const value = node[key];

    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child.type === "string") {
          children.push(child);
        }
      }
    } else if (
      value &&
      typeof value === "object" &&
      typeof value.type === "string"
    ) {
      children.push(value);
    }
  }

  return children;
}

function walk(node, visit, intoFunctions) {
  for (const child of childrenOf(node)) {
    if (!intoFunctions && FUNCTIONS.has(child.type)) {
      continue;
    }

    visit(child);
    walk(child, visit, intoFunctions);
  }
}

function isCacheInvalidation(node) {
  if (node.type !== "CallExpression") {
    return false;
  }

  const { callee } = node;

  return (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier" &&
    callee.property.name === CACHE_METHOD
  );
}

function awaitsInside(node) {
  if (node.type === "AwaitExpression") {
    return true;
  }

  let found = false;

  walk(
    node,
    (child) => {
      if (child.type === "AwaitExpression") {
        found = true;
      }
    },
    false,
  );

  return found;
}

const mutationSettleShape = {
  meta: {
    type: "problem",
    docs: {
      description:
        "쓰기 뒤처리가 기다리지 않는 꼴을 막는다. `onSuccess`는 무효화 프로미스를 돌려주고, 여럿은 `Promise.all`로 함께 기다린다.",
    },
    schema: [],
    messages: {
      voidCall:
        "`onSuccess`에서 무효화를 `void`로 던지지 않는다. 그 프로미스를 돌려줘야 `isSuccess`가 새 데이터가 온 뒤에 서고, 그 값을 읽어 시트를 닫는 자리가 낡은 값을 보여주지 않는다.",
      asyncMarking:
        "`onSuccess`에 `async`를 달지 않는다. 기다릴 것을 `Promise.all`로 묶어 그 프로미스를 돌려주면 끝난다 — `async`와 `return`은 결과가 같고, 꼴이 둘이면 어느 쪽이 기준인지가 흐려진다.",
      sequentialAwait:
        "목록을 루프로 돌며 하나씩 기다리지 않는다. 키 여럿을 무르는 일에 순서가 없어 `Promise.all`로 함께 기다린다.",
    },
  },
  create(context) {
    function reportVoidCalls(settle) {
      walk(
        settle,
        (node) => {
          if (
            node.type === "UnaryExpression" &&
            node.operator === "void" &&
            isCacheInvalidation(node.argument)
          ) {
            context.report({ node, messageId: "voidCall" });
          }
        },
        true,
      );
    }

    function reportSequentialAwaits(settle) {
      walk(
        settle,
        (node) => {
          if (!LOOPS.has(node.type)) {
            return;
          }

          if (node.await || awaitsInside(node.body)) {
            context.report({ node, messageId: "sequentialAwait" });
          }
        },
        true,
      );
    }

    return {
      Property(node) {
        if (propertyNameOf(node) !== SETTLE_CALLBACK) {
          return;
        }

        const settle = node.value;

        if (!FUNCTIONS.has(settle.type)) {
          return;
        }

        if (settle.async) {
          context.report({ node: settle, messageId: "asyncMarking" });
        }

        reportVoidCalls(settle);
        reportSequentialAwaits(settle);
      },
    };
  },
};

export default mutationSettleShape;
