import {
  eventErrors,
  eventErrorCodes,
} from "#/entities/events/models/errors/eventError";

export const eventCreateErrorMessage = "행사를 생성하지 못했습니다.";

export function readCreateEventErrorMessage(error: unknown) {
  const errorCode = eventErrors.read(error);

  switch (errorCode) {
    case eventErrorCodes.createTemplateNotFound:
      return "선택한 행사 템플릿을 찾지 못했습니다.";
    case eventErrorCodes.createDuplicateDate:
      return "이미 행사가 등록된 날짜가 포함되어 있습니다. 중복 날짜를 제외하고 다시 시도해 주세요.";
    case eventErrorCodes.createResultMissing:
      return "생성된 행사 정보를 다시 불러오지 못했습니다.";
    default:
      return (error as Error)?.message ?? eventCreateErrorMessage;
  }
}
