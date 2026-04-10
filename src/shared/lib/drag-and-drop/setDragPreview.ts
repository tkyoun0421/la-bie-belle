import type React from "react";

export function setDragPreview(
  event: React.DragEvent<HTMLElement>,
  previewSelector = "[data-drag-preview]"
) {
  const previewSource = event.currentTarget.closest(previewSelector);

  if (!(previewSource instanceof HTMLElement)) {
    return;
  }

  const preview = previewSource.cloneNode(true);

  if (!(preview instanceof HTMLElement)) {
    return;
  }

  const { left, top, width } = previewSource.getBoundingClientRect();

  preview.style.position = "fixed";
  preview.style.top = "-1000px";
  preview.style.left = "-1000px";
  preview.style.width = `${width}px`;
  preview.style.opacity = "0.55";
  preview.style.pointerEvents = "none";
  preview.style.transform = "scale(0.99)";
  preview.style.boxShadow = "0 20px 48px rgba(15, 23, 42, 0.14)";

  document.body.appendChild(preview);
  event.dataTransfer.setDragImage(
    preview,
    event.clientX - left,
    event.clientY - top
  );

  window.setTimeout(() => {
    preview.remove();
  }, 0);
}
