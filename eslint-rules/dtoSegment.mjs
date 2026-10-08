import {
  API_SEGMENT,
  fileLocation,
  importEdges,
  specifierLocation,
} from "./segments.mjs";

const DTO_SUFFIX = ".dto";
const MAPPER_SUFFIX = ".mapper.ts";

const dtoSegment = {
  meta: {
    type: "problem",
    docs: {
      description:
        "`api/` 밖에서 `.dto.ts`를 당기는 것을 막는다. 통신이 주고받는 꼴은 `api`를 안 떠난다.",
    },
    schema: [],
    messages: {
      dtoOutsideApi:
        "'{{source}}' 는 통신이 주고받는 꼴이고 `api/`를 안 떠난다. `api/*.api.ts`가 `utils/<도메인>.mapper.ts`를 불러 도메인 모양으로 바꿔 돌려주고, 이 파일은 `model/<도메인>.type.ts`의 도메인 타입을 당겨라.",
    },
  },
  create(context) {
    const here = fileLocation(context);

    if (
      here?.segment === API_SEGMENT ||
      context.filename.endsWith(MAPPER_SUFFIX)
    ) {
      return {};
    }

    return importEdges((node) => {
      const source = node.source.value;

      if (!source.endsWith(DTO_SUFFIX)) {
        return;
      }

      if (specifierLocation(source)?.segment !== API_SEGMENT) {
        return;
      }

      context.report({
        node,
        messageId: "dtoOutsideApi",
        data: { source },
      });
    });
  },
};

export default dtoSegment;
