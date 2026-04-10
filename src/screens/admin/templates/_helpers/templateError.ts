import {
  eventTemplateErrors,
  eventTemplateErrorCodes,
} from "#/entities/events/models/errors/eventTemplateError";

export const templateDeleteErrorMessage =
  "행사 템플릿을 삭제하지 못했습니다.";
export const templateListErrorMessage =
  "행사 템플릿 목록을 불러오지 못했습니다.";
export const templateSaveErrorMessage =
  "행사 템플릿을 저장하지 못했습니다.";

export function readTemplateDeleteErrorMessage(error: unknown) {
  const errorCode = eventTemplateErrors.read(error);

  switch (errorCode) {
    case eventTemplateErrorCodes.deletePrimaryForbidden:
      return "대표 템플릿은 삭제할 수 없습니다.";
    case eventTemplateErrorCodes.deleteLastForbidden:
      return "마지막 템플릿은 삭제할 수 없습니다.";
    case eventTemplateErrorCodes.deleteTargetNotFound:
      return "선택한 행사 템플릿을 찾지 못했습니다.";
    default:
      return templateDeleteErrorMessage;
  }
}

export function readTemplateListErrorMessage(error: unknown) {
  const errorCode = eventTemplateErrors.read(error);

  switch (errorCode) {
    case eventTemplateErrorCodes.listFailed:
      return templateListErrorMessage;
    default:
      return templateListErrorMessage;
  }
}

export function readTemplateSaveErrorMessage(error: unknown) {
  const errorCode = eventTemplateErrors.read(error);

  switch (errorCode) {
    case eventTemplateErrorCodes.updateTargetNotFound:
    case eventTemplateErrorCodes.deleteTargetNotFound:
      return "선택한 행사 템플릿을 찾지 못했습니다.";
    default:
      return templateSaveErrorMessage;
  }
}
