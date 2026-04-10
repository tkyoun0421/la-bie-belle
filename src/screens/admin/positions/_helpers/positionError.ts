import {
  positionErrorCodes,
  readPositionErrorCode,
} from "#/entities/positions/models/errors/positionError";

export const positionDeleteErrorMessage = "포지션을 삭제하지 못했습니다.";
export const positionListErrorMessage = "포지션 목록을 불러오지 못했습니다.";
export const positionReorderErrorMessage =
  "포지션 순서를 저장하지 못했습니다.";
export const positionSaveErrorMessage = "포지션을 저장하지 못했습니다.";

export function readPositionDeleteErrorMessage(error: unknown) {
  const errorCode = readPositionErrorCode(error);

  switch (errorCode) {
    case positionErrorCodes.deleteInUse:
      return "템플릿에서 사용 중인 포지션은 삭제할 수 없습니다.";
    case positionErrorCodes.deleteTargetNotFound:
      return "선택한 포지션을 찾지 못했습니다.";
    default:
      return positionDeleteErrorMessage;
  }
}

export function readPositionListErrorMessage(error: unknown) {
  const errorCode = readPositionErrorCode(error);

  switch (errorCode) {
    case positionErrorCodes.listFailed:
      return positionListErrorMessage;
    default:
      return positionListErrorMessage;
  }
}

export function readPositionReorderErrorMessage(error: unknown) {
  const errorCode = readPositionErrorCode(error);

  switch (errorCode) {
    case positionErrorCodes.reorderFailed:
      return positionReorderErrorMessage;
    default:
      return positionReorderErrorMessage;
  }
}

export function readPositionSaveErrorMessage(error: unknown) {
  const errorCode = readPositionErrorCode(error);

  switch (errorCode) {
    case positionErrorCodes.duplicateName:
      return "같은 이름의 포지션이 이미 있습니다.";
    default:
      return positionSaveErrorMessage;
  }
}
