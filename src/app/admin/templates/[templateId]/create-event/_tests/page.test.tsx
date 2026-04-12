import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockedAdminTemplateEventCreateScreen,
  mockedCreateSupabaseAdminClient,
  mockedNotFound,
  mockedReadEventTemplateById,
  mockedRequireAdminPageActor,
} = vi.hoisted(() => ({
  mockedAdminTemplateEventCreateScreen: vi.fn(
    ({ template }: { template: { name: string } }) => <div>{template.name}</div>
  ),
  mockedCreateSupabaseAdminClient: vi.fn(),
  mockedNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  mockedReadEventTemplateById: vi.fn(),
  mockedRequireAdminPageActor: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: mockedNotFound,
}));

vi.mock("#/entities/events/repositories/readEventTemplateRepository", () => ({
  readEventTemplateById: mockedReadEventTemplateById,
}));

vi.mock(
  "#/screens/admin/templates/[templateId]/create-event/AdminTemplateEventCreateScreen",
  () => ({
    AdminTemplateEventCreateScreen: mockedAdminTemplateEventCreateScreen,
  })
);

vi.mock("#/shared/lib/auth/adminActor", () => ({
  requireAdminPageActor: mockedRequireAdminPageActor,
}));

vi.mock("#/shared/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mockedCreateSupabaseAdminClient,
}));

import AdminTemplateEventCreatePage from "#/app/admin/templates/[templateId]/create-event/page";

describe("AdminTemplateEventCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires the admin gate, reads the template, and renders the screen", async () => {
    const client = { auth: {} };

    mockedCreateSupabaseAdminClient.mockReturnValue(client);
    mockedReadEventTemplateById.mockResolvedValue({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      name: "주말 웨딩 기본형",
      slotDefaults: [],
      timeLabel: "10:30 - 16:00",
    });

    const result = await AdminTemplateEventCreatePage({
      params: Promise.resolve({
        templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      }),
    });

    render(result);

    expect(mockedRequireAdminPageActor).toHaveBeenCalledTimes(1);
    expect(mockedCreateSupabaseAdminClient).toHaveBeenCalledTimes(1);
    expect(mockedReadEventTemplateById).toHaveBeenCalledWith(
      "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      { client }
    );
    expect(screen.getByText("주말 웨딩 기본형")).toBeInTheDocument();
  });

  it("routes missing templates to notFound", async () => {
    mockedCreateSupabaseAdminClient.mockReturnValue({ auth: {} });
    mockedReadEventTemplateById.mockResolvedValue(null);

    await expect(
      AdminTemplateEventCreatePage({
        params: Promise.resolve({
          templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockedNotFound).toHaveBeenCalledTimes(1);
  });
});
