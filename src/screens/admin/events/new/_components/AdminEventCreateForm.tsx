"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useAdminEventCreateFormState } from "#/screens/admin/events/new/_hooks/useAdminEventCreateFormState";
import { Alert, AlertDescription, AlertTitle } from "#/shared/components/ui/alert";
import { Badge } from "#/shared/components/ui/badge";
import { Button } from "#/shared/components/ui/button";
import { Calendar } from "#/shared/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#/shared/components/ui/card";
import { Input } from "#/shared/components/ui/input";
import { Label } from "#/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/shared/components/ui/select";

export function AdminEventCreateForm() {
  const {
    existingEventDates,
    form,
    handleTemplateChange,
    isSaving,
    isSuccess,
    selectedTemplate,
    serverError,
    submit,
    templates,
  } = useAdminEventCreateFormState();

  const titleError = form.formState.errors.title?.message;
  const templateIdError = form.formState.errors.templateId?.message;
  const eventDatesError = form.formState.errors.eventDates?.message;
  const selectedDates = form.watch("eventDates");

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-12">
        <div className="rounded-full bg-green-100 p-4">
          <svg
            className="h-12 w-12 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 13l4 4L19 7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">
            행사 생성이 완료되었습니다.
          </h2>
          <p className="mt-2 text-muted-foreground">
            총 {selectedDates.length}개의 행사가 성공적으로 생성되었습니다.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/">대시보드로 이동</Link>
          </Button>
          <Button onClick={() => window.location.reload()}>
            추가로 행사 만들기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_380px]">
      <div className="grid gap-6">
        <Card className="border border-border/70 bg-background/92">
          <CardHeader>
            <CardTitle>템플릿 및 기본 정보</CardTitle>
            <CardDescription>
              생성할 행사의 기본 틀이 되는 템플릿과 행사명을 입력하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="template-id">행사 템플릿</Label>
              <Select
                onValueChange={handleTemplateChange}
                value={form.watch("templateId")}
              >
                <SelectTrigger id="template-id">
                  <SelectValue placeholder="템플릿을 선택해 주세요" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.timeLabel})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templateIdError ? (
                <p className="text-sm font-medium text-destructive">
                  {templateIdError}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="event-title">행사명</Label>
              <Input
                aria-invalid={titleError ? "true" : "false"}
                id="event-title"
                placeholder="행사명을 입력하세요 (예: 4월 20일 주말 웨딩)"
                {...form.register("title")}
              />
              {titleError ? (
                <p className="text-sm font-medium text-destructive">
                  {titleError}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-background/92">
          <CardHeader>
            <CardTitle>날짜 선택</CardTitle>
            <CardDescription>
              행사를 생성할 날짜를 달력에서 모두 선택해 주세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Calendar
              className="rounded-[28px] border border-border/60 bg-muted/10 mx-auto"
              disabled={(date) =>
                existingEventDates.has(format(date, "yyyy-MM-dd"))
              }
              locale={ko}
              mode="multiple"
              onSelect={(nextDates) => {
                form.setValue(
                  "eventDates",
                  (nextDates ?? []).map((date) => format(date, "yyyy-MM-dd"))
                );
              }}
              selected={selectedDates.map(
                (value) => new Date(`${value}T00:00:00`)
              )}
            />
            {eventDatesError ? (
              <p className="text-sm font-medium text-destructive text-center">
                {eventDatesError}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">비활성화: 이미 행사가 있는 날짜</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 h-fit sticky top-6">
        <Card className="border border-border/70 bg-background/92 shadow-lg ring-1 ring-primary/5">
          <CardHeader>
            <CardTitle>생성 요약</CardTitle>
            <CardDescription>
              선택한 설정으로 행사를 대량 생성합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">템플릿:</span>
                <span className="font-medium text-foreground truncate max-w-[200px]">
                  {selectedTemplate?.name ?? "미선택"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">행사명:</span>
                <span className="font-medium text-foreground truncate max-w-[200px]">
                  {form.watch("title") || "미입력"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">선택 일수:</span>
                <span className="font-medium text-primary">
                  {selectedDates.length}일
                </span>
              </div>
            </div>

            {selectedDates.length > 0 && (
              <div className="flex flex-wrap gap-1.5 py-2">
                {selectedDates.map((date) => (
                  <Badge key={date} variant="secondary">
                    {format(new Date(`${date}T00:00:00`), "M/d")}
                  </Badge>
                ))}
              </div>
            )}

            {serverError ? (
              <Alert variant="destructive">
                <AlertTitle>생성 실패</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <form onSubmit={submit}>
              <Button
                className="w-full h-12 text-base font-bold shadow-md shadow-primary/20"
                disabled={isSaving || selectedDates.length === 0}
                type="submit"
              >
                {isSaving
                  ? "행사 생성 중..."
                  : `${selectedDates.length}개의 행사 생성하기`}
              </Button>
            </form>

            <Button
              asChild
              className="w-full"
              type="button"
              variant="outline"
            >
              <Link href="/admin/templates">템플릿 목록으로</Link>
            </Button>
          </CardContent>
        </Card>

        {selectedTemplate && (
          <Card className="border border-border/70 bg-background/92">
            <CardHeader>
              <CardTitle className="text-sm">템플릿 슬롯 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.slotDefaults.map((slot) => (
                  <Badge
                    className="text-[10px]"
                    key={slot.positionId}
                    variant="outline"
                  >
                    {slot.positionName} ({slot.requiredCount})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
