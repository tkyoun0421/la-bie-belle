const CLASS_ATTRIBUTES = new Set(["className", "class"]);
const CLASS_FUNCTIONS = new Set(["cn", "cva", "clsx", "cx", "twMerge", "tv"]);

function collectStrings(node, found) {
  if (!node || typeof node.type !== "string") {
    return;
  }

  if (node.type === "Literal" && typeof node.value === "string") {
    found.push({ node, text: node.value });
    return;
  }

  if (node.type === "TemplateLiteral") {
    for (const quasi of node.quasis) {
      found.push({ node: quasi, text: quasi.value.cooked ?? quasi.value.raw });
    }
    for (const expression of node.expressions) {
      collectStrings(expression, found);
    }
    return;
  }

  for (const key of Object.keys(node)) {
    if (key === "parent") {
      continue;
    }
    const value = node[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        collectStrings(child, found);
      }
    } else if (
      value &&
      typeof value === "object" &&
      typeof value.type === "string"
    ) {
      collectStrings(value, found);
    }
  }
}

export function classStringVisitor(onClassToken) {
  function report(node, text) {
    for (const token of text.split(/\s+/)) {
      if (token) {
        onClassToken(token, node);
      }
    }
  }

  return {
    JSXAttribute(node) {
      if (
        node.name?.type !== "JSXIdentifier" ||
        !CLASS_ATTRIBUTES.has(node.name.name)
      ) {
        return;
      }
      const found = [];
      collectStrings(node.value, found);
      for (const entry of found) {
        report(entry.node, entry.text);
      }
    },
    CallExpression(node) {
      if (
        node.callee.type !== "Identifier" ||
        !CLASS_FUNCTIONS.has(node.callee.name)
      ) {
        return;
      }
      const found = [];
      for (const argument of node.arguments) {
        collectStrings(argument, found);
      }
      for (const entry of found) {
        report(entry.node, entry.text);
      }
    },
  };
}

export function utilityOf(classToken) {
  const segments = [];
  let depth = 0;
  let current = "";

  for (const character of classToken) {
    if (character === "[" || character === "(") {
      depth += 1;
    } else if (character === "]" || character === ")") {
      depth = Math.max(0, depth - 1);
    } else if (character === ":" && depth === 0) {
      segments.push(current);
      current = "";
      continue;
    }
    current += character;
  }

  segments.push(current);
  return segments[segments.length - 1];
}

export function arbitraryValueOf(utility) {
  const start = utility.indexOf("[");
  if (start === -1) {
    return null;
  }

  let depth = 0;
  for (let index = start; index < utility.length; index += 1) {
    if (utility[index] === "[") {
      depth += 1;
    } else if (utility[index] === "]") {
      depth -= 1;
      if (depth === 0) {
        return utility.slice(start + 1, index);
      }
    }
  }

  return null;
}
