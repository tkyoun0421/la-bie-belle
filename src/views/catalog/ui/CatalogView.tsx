"use client";

import { useState } from "react";

import { Badge } from "@/shared/ui/badge";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import { Chip } from "@/shared/ui/chip";
import { ConnectivityBanner } from "@/shared/ui/connectivity-banner";
import { Dialog } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { NotificationRow } from "@/shared/ui/notification-row";
import { ScheduleRow } from "@/shared/ui/schedule-row";
import { SelectField } from "@/shared/ui/select-field";
import { showSnackbar, SnackbarProvider } from "@/shared/ui/snackbar";

const SELECT_OPTIONS = [
  { value: "main", label: "본점" },
  { value: "branch", label: "지점" },
];

const CALENDAR_MONTH = new Date(2026, 7, 1);
const CALENDAR_DATE_STATES = [
  { date: new Date(2026, 7, 2), state: "none" as const },
  { date: new Date(2026, 7, 3), state: "open" as const },
  { date: new Date(2026, 7, 4), state: "selected" as const },
  { date: new Date(2026, 7, 5), state: "requested" as const },
  { date: new Date(2026, 7, 6), state: "closed" as const },
  { date: new Date(2026, 7, 7), state: "confirmed" as const },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-border pb-8">
      <h2 className="typo-headline-md text-text-strong">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function CatalogView() {
  const [selectValue, setSelectValue] = useState<string | null>("main");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chipSelected, setChipSelected] = useState(false);

  return (
    <main className="mx-auto flex max-w-screen-sm flex-col gap-8 p-6 pb-24">
      <h1 className="typo-display text-text-strong">디자인 시스템 카탈로그</h1>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">신청하기</Button>
          <Button variant="secondary">보류</Button>
          <Button variant="tertiary">자세히 보기</Button>
          <Button variant="destructive">삭제</Button>
          <Button variant="icon" aria-label="닫기">
            ×
          </Button>
          <Button loading>저장 중</Button>
          <Button disabled disabledReason="휴대폰 인증이 필요합니다">
            확인
          </Button>
        </div>
      </Section>

      <Section title="Input과 선택 필드">
        <Input label="휴대폰 번호" placeholder="010-0000-0000" />
        <Input label="이메일" error="올바른 이메일을 입력하세요" />
        <SelectField
          label="근무지"
          value={selectValue}
          options={SELECT_OPTIONS}
          onChange={setSelectValue}
        />
      </Section>

      <Section title="Bottom sheet">
        <Button onClick={() => setSheetOpen(true)}>바텀시트 열기</Button>
        <BottomSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="근무지 선택"
          description="선택한 근무지로 배정 요청을 보냅니다."
        >
          <p className="py-4 typo-body text-text">본점 · 지점 목록이 여기에 표시됩니다.</p>
        </BottomSheet>
      </Section>

      <Section title="Dialog">
        <Button variant="destructive" onClick={() => setDialogOpen(true)}>
          근무 취소하기
        </Button>
        <Dialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="근무를 취소할까요?"
          description="취소하면 되돌릴 수 없어요."
          confirmLabel="취소하기"
          tone="destructive"
          onConfirm={() => setDialogOpen(false)}
        />
      </Section>

      <Section title="Snackbar">
        <SnackbarProvider />
        <Button
          onClick={() =>
            showSnackbar("일정을 취소했어요", {
              action: { label: "실행 취소", onClick: () => {} },
            })
          }
        >
          스낵바 보여주기
        </Button>
      </Section>

      <Section title="Badge와 chip">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>신청</Badge>
          <Badge tone="neutral">마감</Badge>
          <Badge tone="action">확정</Badge>
          <Badge tone="warning">교육</Badge>
          <Badge tone="danger">만료</Badge>
        </div>
        <Chip selected={chipSelected} onSelectedChange={setChipSelected}>
          일요일
        </Chip>
      </Section>

      <Section title="Calendar">
        <Calendar
          month={CALENDAR_MONTH}
          dateStates={CALENDAR_DATE_STATES}
          onSelectDate={() => {}}
        />
      </Section>

      <Section title="Schedule row">
        <ScheduleRow
          date={new Date(2026, 7, 3)}
          scheduledStart="09:00"
          scheduledEnd="18:00"
          position="플로어"
          status="확정"
          onPress={() => {}}
        />
        <ScheduleRow
          date={new Date(2026, 7, 5)}
          scheduledStart="10:00"
          scheduledEnd="19:00"
          position="주차"
          status="변경됨"
          changeNote="시작 시간이 30분 당겨졌어요"
          onPress={() => {}}
        />
      </Section>

      <Section title="Notification row">
        <NotificationRow
          title="근무 배정이 확정됐어요"
          body="8월 3일 플로어 근무가 확정됐어요"
          relativeTime="3시간 전"
          unread
          onPress={() => {}}
        />
        <NotificationRow
          title="예상 급여가 갱신됐어요"
          body="이번 달 예상 급여를 확인하세요"
          relativeTime="어제"
          unread={false}
          onPress={() => {}}
        />
      </Section>

      <Section title="Connectivity banner">
        <div className="relative h-12">
          <ConnectivityBanner status="offline" className="static" />
        </div>
        <div className="relative h-12">
          <ConnectivityBanner status="recovered" className="static" />
        </div>
      </Section>
    </main>
  );
}
