import { eventTemplatesResponseSchema } from "#/queries/events/models/schemas/eventTemplate";

export async function fetchEventTemplates() {
  const response = await fetch("/api/event-templates", {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("행사 템플릿 목록을 불러오지 못했습니다.");
  }

  const data = await response.json();

  return eventTemplatesResponseSchema.parse(data).templates;
}
