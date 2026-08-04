const REGEXP_SPECIAL_CHARS = "\\^$.|?+()[]{}";

export function globToRegExp(pattern) {
  let source = "";
  let index = 0;

  while (index < pattern.length) {
    const char = pattern[index];
    const isDoubleStar = char === "*" && pattern[index + 1] === "*";

    if (isDoubleStar && pattern[index + 2] === "/") {
      source += "(?:[^/]*/)*";
      index += 3;
    } else if (isDoubleStar) {
      source += ".*";
      index += 2;
    } else if (char === "*") {
      source += "[^/]*";
      index += 1;
    } else if (REGEXP_SPECIAL_CHARS.includes(char)) {
      source += `\\${char}`;
      index += 1;
    } else {
      source += char;
      index += 1;
    }
  }

  return new RegExp(`^${source}$`);
}

export function matchesImportPattern(pattern, source) {
  if (pattern.includes("*")) {
    return globToRegExp(pattern).test(source);
  }
  return source === pattern || source.startsWith(`${pattern}/`);
}
