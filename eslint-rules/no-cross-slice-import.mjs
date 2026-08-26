import path from "node:path";

const SLICED_LAYERS = new Set(["entities", "features", "screens"]);
const LOCATION = /(?:^|\/)src\/([a-z-]+)\/([^/]+)\//;
const SPECIFIER = /^@\/([a-z-]+)\/([^/]+)/;

const noCrossSliceImport = {
  meta: {
    type: "problem",
    docs: {
      description: "같은 층의 다른 슬라이스를 직접 import하는 것을 막는다.",
    },
    schema: [],
    messages: {
      crossSlice:
        "'{{layer}}/{{slice}}' 는 같은 층의 다른 슬라이스다. 슬라이스끼리는 위 층에서 조립해라.",
    },
  },
  create(context) {
    const relative = path
      .relative(context.cwd, context.filename)
      .split(path.sep)
      .join("/");
    const here = LOCATION.exec(relative);
    if (!here || !SLICED_LAYERS.has(here[1])) {
      return {};
    }

    const [, layer, slice] = here;

    return {
      ImportDeclaration(node) {
        const there = SPECIFIER.exec(node.source.value);
        if (!there || there[1] !== layer || there[2] === slice) {
          return;
        }
        context.report({
          node: node.source,
          messageId: "crossSlice",
          data: { layer: there[1], slice: there[2] },
        });
      },
    };
  },
};

export default noCrossSliceImport;
