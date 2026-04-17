"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateBulkEventsMutation } from "#/mutations/events/hooks/useCreateBulkEventsMutation";
import {
  createBulkEventsInputSchema,
  type CreateBulkEventsInput,
} from "#/mutations/events/schemas/createBulkEvents";
import { useEventsQuery } from "#/queries/events/hooks/useEventsQuery";
import { useEventTemplatesQuery } from "#/queries/events/hooks/useEventTemplatesQuery";
import { readCreateEventErrorMessage } from "#/screens/admin/templates/_helpers/createEventError";

export function useAdminEventCreateFormState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTemplateId = searchParams.get("templateId") ?? "";

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const templatesQuery = useEventTemplatesQuery();
  const eventsQuery = useEventsQuery();

  const createBulkEventsMutation = useCreateBulkEventsMutation();

  const form = useForm<CreateBulkEventsInput>({
    defaultValues: {
      eventDates: [],
      templateId: initialTemplateId,
      title: "",
    },
    resolver: zodResolver(createBulkEventsInputSchema),
  });

  const selectedTemplateId = form.watch("templateId");
  const selectedTemplate = templatesQuery.data?.find(
    (t) => t.id === selectedTemplateId
  );

  useEffect(() => {
    if (initialTemplateId && templatesQuery.data) {
      const template = templatesQuery.data.find((t) => t.id === initialTemplateId);
      if (template) {
        form.setValue("templateId", initialTemplateId);
        form.setValue("title", template.name);
      }
    }
  }, [initialTemplateId, templatesQuery.data, form]);

  const handleTemplateChange = (templateId: string) => {
    form.setValue("templateId", templateId);
    const template = templatesQuery.data?.find((t) => t.id === templateId);
    if (template) {
      form.setValue("title", template.name);
    }
  };

  const submit = form.handleSubmit(async (values) => {
    setServerError(null);
    setIsSuccess(false);

    try {
      await createBulkEventsMutation.mutateAsync(values);
      setIsSuccess(true);
      // We don't necessarily redirect if bulk creating, or we might redirect to dashboard
      // But for now, let's just show success.
    } catch (error) {
      setServerError(readCreateEventErrorMessage(error));
    }
  });

  const existingEventDates = new Set(
    eventsQuery.data?.map((e) => e.eventDate) ?? []
  );

  return {
    existingEventDates,
    form,
    handleTemplateChange,
    isSaving: createBulkEventsMutation.isPending,
    isSuccess,
    selectedTemplate,
    serverError,
    submit,
    templates: templatesQuery.data ?? [],
  };
}
