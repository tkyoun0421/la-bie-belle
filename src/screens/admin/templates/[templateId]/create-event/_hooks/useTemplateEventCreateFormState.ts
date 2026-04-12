import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateEventMutation } from "#/mutations/events/hooks/useCreateEventMutation";
import {
  createEventInputSchema,
  type CreateEventInput,
} from "#/mutations/events/schemas/createEvent";
import { readCreateEventErrorMessage } from "#/screens/admin/templates/_helpers/createEventError";

type UseTemplateEventCreateFormStateOptions = {
  defaultValues: CreateEventInput;
  onSubmitted: (eventId: string) => void;
};

export function useTemplateEventCreateFormState({
  defaultValues,
  onSubmitted,
}: UseTemplateEventCreateFormStateOptions) {
  const [serverError, setServerError] = useState<string | null>(null);
  const createEventMutation = useCreateEventMutation();
  const form = useForm<CreateEventInput>({
    defaultValues,
    resolver: zodResolver(createEventInputSchema),
  });

  const submit = form.handleSubmit(
    async (values) => {
      setServerError(null);

      try {
        const event = await createEventMutation.mutateAsync(values);
        onSubmitted(event.id);
      } catch (error) {
        setServerError(readCreateEventErrorMessage(error));
      }
    },
    () => {
      setServerError(null);
    }
  );

  return {
    form,
    isSaving: createEventMutation.isPending,
    serverError,
    submit,
  };
}
