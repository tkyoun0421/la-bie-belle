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
    case eventErrorCodes.createResultMissing:
      return "생성된 행사 정보를 다시 불러오지 못했습니다.";
    default:
      return eventCreateErrorMessage;
  }
}
