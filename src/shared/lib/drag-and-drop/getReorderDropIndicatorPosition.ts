export function getReorderDropIndicatorPosition(
  draggingIndex: number,
  targetIndex: number
) {
  if (
    draggingIndex === -1 ||
    targetIndex === -1 ||
    draggingIndex === targetIndex
  ) {
    return null;
  }

  return draggingIndex > targetIndex ? "top" : "bottom";
}
