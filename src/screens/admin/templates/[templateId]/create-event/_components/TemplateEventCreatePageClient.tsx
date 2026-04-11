"use client";

import { useRouter } from "next/navigation";
import type { EventTemplate } from "#/entities/events/models/schemas/eventTemplate";
import { useTemplateEventCreateFormState } from "#/screens/admin/templates/[templateId]/create-event/_hooks/useTemplateEventCreateFormState";
import { Alert, AlertDescription, AlertTitle } from "#/shared/components/ui/alert";
import { Badge } from "#/shared/components/ui/badge";
import { Button } from "#/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/shared/components/ui/card";
import { Input } from "#/shared/components/ui/input";
import { Label } from "#/shared/components/ui/label";

type TemplateEventCreatePageClientProps = {
  template: EventTemplate;
};

export function TemplateEventCreatePageClient({
  template,
}: Readonly<TemplateEventCreatePageClientProps>) {
  const router = useRouter();
  const { form, isSaving, serverError, submit } =
    useTemplateEventCreateFormState({
      defaultValues: {
        eventDate: "",
        templateId: template.id,
        title: template.name,
      },
      onSubmitted(eventId) {
        router.push(`/events/${eventId}`);
      },
    });
  const titleError = form.formState.errors.title?.message;
  const eventDateError = form.formState.errors.eventDate?.message;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_380px]">
      <Card className="border border-border/70 bg-background/92">
        <CardHeader>
          <CardTitle>행사 생성 정보</CardTitle>
          <CardDescription>
            템플릿 기본 시간과 슬롯은 서버에서 복사되고, 여기서는 행사명과
            날짜만 받습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-5" onSubmit={submit}>
            <input type="hidden" {...form.register("templateId")} />

            <div className="grid gap-2">
              <Label htmlFor="event-title">행사명</Label>
              <Input
                aria-invalid={titleError ? "true" : "false"}
                id="event-title"
                placeholder="예: 4월 20일 주말 웨딩"
                {...form.register("title")}
              />
              {titleError ? (
                <p className="text-sm font-medium text-destructive">
                  {titleError}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="event-date">행사 날짜</Label>
              <Input
                aria-invalid={eventDateError ? "true" : "false"}
                id="event-date"
                type="date"
                {...form.register("eventDate")}
              />
              {eventDateError ? (
                <p className="text-sm font-medium text-destructive">
                  {eventDateError}
                </p>
              ) : null}
            </div>

            {serverError ? (
              <Alert variant="destructive">
                <AlertTitle>행사를 생성할 수 없습니다</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <Button disabled={isSaving} type="submit">
                {isSaving ? "생성 중..." : "행사 생성"}
              </Button>
              <Button
                onClick={() => router.push("/admin/templates")}
                type="button"
                variant="outline"
              >
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-border/70 bg-background/92">
        <CardHeader>
          <CardTitle>선택한 템플릿</CardTitle>
          <CardDescription>
            생성 시 아래 시간과 슬롯 기본값이 행사에 그대로 복사됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <p className="text-lg font-semibold text-foreground">
              {template.name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {template.timeLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {template.slotDefaults.map((slot) => (
              <Badge key={`${template.id}-${slot.positionId}`} variant="secondary">
                {slot.positionName} / 필수 {slot.requiredCount}
              </Badge>
            ))}
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm leading-6 text-muted-foreground">
            상세 페이지 진입 후에는 복사된 슬롯, 행사 메타데이터, 이후 신청과
            배정이 이 행사 기준으로 이어집니다.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
