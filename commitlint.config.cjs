const Configuration = {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "body-min-lines": (parsed, _when, value) => {
          const lines = (parsed.body ?? "")
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

          return [lines.length >= value, `body must contain at least ${value} non-empty lines`];
        }
      }
    }
  ],
  rules: {
    "type-enum": [2, "always", ["feat", "fix", "docs", "test", "refactor", "chore", "ci"]],
    "body-empty": [2, "never"],
    "body-min-lines": [2, "always", 2]
  }
};

module.exports = Configuration;
