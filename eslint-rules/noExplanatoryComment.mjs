const TOOL_DIRECTIVE =
  /^[\s*/]*(?:eslint-disable|eslint-enable|eslint-env|globals?\s|@ts-expect-error|@ts-ignore|@ts-nocheck|prettier-ignore|biome-ignore|@type\b|@typedef\b|@jsx\b|@jest-environment\b|istanbul\s|[cv]8\s+ignore|#?__PURE__|<reference\b)/;

const noExplanatoryComment = {
  meta: {
    type: "problem",
    docs: {
      description:
        "설명 주석을 막는다. 남는 것은 도구가 읽는 지시뿐이고 그것은 주석이 아니라 코드다.",
    },
    schema: [],
    messages: {
      explanatory:
        "설명 주석은 소스가 바뀔 때 같이 안 바뀌어 거짓이 된다. 이름과 구조와 테스트 이름이 의도를 들고, 왜 그 자리인지는 `docs/`가 가져라.",
    },
  },
  create(context) {
    return {
      "Program:exit"() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (TOOL_DIRECTIVE.test(comment.value.trimStart())) {
            continue;
          }

          context.report({ loc: comment.loc, messageId: "explanatory" });
        }
      },
    };
  },
};

export default noExplanatoryComment;
