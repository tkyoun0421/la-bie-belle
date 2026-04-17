import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCreateBulkEventsMutation } from "#/mutations/events/hooks/useCreateBulkEventsMutation";
import { createBulkEventsAction } from "#/mutations/events/actions/createBulkEvents";

vi.mock("../../actions/createBulkEvents", () => ({
  createBulkEventsAction: vi.fn(),
}));

const queryClient = new QueryClient();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("useCreateBulkEventsMutation", () => {
  it("should call createBulkEventsAction with correct input", async () => {
    const mockAction = vi.mocked(createBulkEventsAction);
    mockAction.mockResolvedValue({ eventIds: ["1", "2"] });

    const { result } = renderHook(() => useCreateBulkEventsMutation(), { wrapper });

    result.current.mutate({
      eventDates: ["2026-05-01", "2026-05-02"],
      templateId: "template-1",
      title: "New Event",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAction).toHaveBeenCalledWith(
      expect.objectContaining({
        eventDates: ["2026-05-01", "2026-05-02"],
        templateId: "template-1",
      })
    );
  });
});
