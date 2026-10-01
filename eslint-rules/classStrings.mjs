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

export function segmentsOf(classToken) {
  const segments = [];
  let bracketDepth = 0;
  let parenDepth = 0;
  let current = "";

  for (const character of classToken) {
    if (character === "[") {
      bracketDepth += 1;
    } else if (character === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
    } else if (bracketDepth === 0 && character === "(") {
      parenDepth += 1;
    } else if (bracketDepth === 0 && character === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
    } else if (character === ":" && bracketDepth === 0 && parenDepth === 0) {
      segments.push(current);
      current = "";
      continue;
    }
    current += character;
  }

  segments.push(current);
  return segments;
}

export function utilityOf(classToken) {
  const segments = segmentsOf(classToken);
  return segments[segments.length - 1];
}

export function arbitraryValuesOf(utility) {
  const values = [];
  let depth = 0;
  let start = -1;

  for (let index = 0; index < utility.length; index += 1) {
    const character = utility[index];
    if (character === "[") {
      if (depth === 0) {
        start = index;
      }
      depth += 1;
    } else if (character === "]" && depth > 0) {
      depth -= 1;
      if (depth === 0) {
        values.push(utility.slice(start + 1, index));
      }
    }
  }

  return values;
}
