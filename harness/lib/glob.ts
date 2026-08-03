function escapeRegExpChar(char: string): string {
  return /[.*+?^${}()|[\]\\]/u.test(char) ? `\\${char}` : char;
}

/**
 * Translates a path glob into an anchored regular expression.
 *
 * - `*` matches any run of characters inside one path segment
 * - `?` matches a single character inside one path segment
 * - `**` matches across segments; `**\/` also matches zero segments
 */
export function globToRegExp(glob: string): RegExp {
  let pattern = "";
  let cursor = 0;

  while (cursor < glob.length) {
    const char = glob[cursor] ?? "";
    if (char === "*") {
      if (glob[cursor + 1] === "*") {
        if (glob[cursor + 2] === "/") {
          pattern += "(?:[^/]*/)*";
          cursor += 3;
          continue;
        }
        pattern += ".*";
        cursor += 2;
        continue;
      }
      pattern += "[^/]*";
      cursor += 1;
      continue;
    }
    if (char === "?") {
      pattern += "[^/]";
      cursor += 1;
      continue;
    }
    pattern += escapeRegExpChar(char);
    cursor += 1;
  }

  return new RegExp(`^${pattern}$`, "u");
}

export function matchesAnyGlob(path: string, globs: readonly string[]): boolean {
  return globs.some((glob) => globToRegExp(glob).test(path));
}
