"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

import type { EstimatedPay } from "@/entities/pay/model/estimated-pay";
import type { RehearsalEntry } from "@/entities/pay/model/rehearsal-entry";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { showSnackbar } from "@/shared/ui/snackbar";

type PayViewProps = {
  estimatedPay: EstimatedPay;
  rehearsalEntries: readonly RehearsalEntry[];
};

const MOCK_HOURLY_RATE = 15000;

function formatAmount(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

function parseHours(startTime: string, endTime: string) {
  const [startHour = 0, startMinute = 0] = startTime.split(":").map(Number);
  const [endHour = 0, endMinute = 0] = endTime.split(":").map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  return Number.isFinite(minutes) && minutes > 0 ? minutes / 60 : 0;
}

export function PayView({ estimatedPay, rehearsalEntries: initialRehearsalEntries }: PayViewProps) {
  const [hideAmount, setHideAmount] = useState(false);
  const [rehearsalEntries, setRehearsalEntries] = useState<RehearsalEntry[]>([
    ...initialRehearsalEntries,
  ]);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RehearsalEntry | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  function resetForm() {
    setDate("");
    setStartTime("");
    setEndTime("");
  }

  function handleAdd() {
    const entry: RehearsalEntry = {
      id: `reh-${rehearsalEntries.length}-${date}-${startTime}`,
      date,
      startTime,
      endTime,
      amount: Math.round(parseHours(startTime, endTime) * MOCK_HOURLY_RATE),
    };
    setRehearsalEntries((previous) => [...previous, entry]);
    setAddSheetOpen(false);
    resetForm();
  }

  function handleDelete(entry: RehearsalEntry) {
    setRehearsalEntries((previous) => previous.filter((item) => item.id !== entry.id));
    setEditingEntry(null);
    showSnackbar("리허설 기록을 삭제했어요", {
      action: {
        label: "되돌리기",
        onClick: () => setRehearsalEntries((previous) => [...previous, entry]),
      },
    });
  }

  const amountText = (amount: number) => (hideAmount ? "••••••" : formatAmount(amount));

  return (
    <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-6 p-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="typo-display text-text-strong">예상 급여</h1>
        <Button
          variant="icon"
          aria-label={hideAmount ? "금액 표시하기" : "금액 숨기기"}
          onClick={() => setHideAmount((previous) => !previous)}
        >
          {hideAmount ? (
            <EyeOff aria-hidden className="size-5" />
          ) : (
            <Eye aria-hidden className="size-5" />
          )}
        </Button>
      </div>

      <section className="flex flex-col gap-1">
        <p className="typo-caption text-text">이번 달 예상 합계</p>
        <p className="typo-display text-text-strong">{amountText(estimatedPay.totalAmount)}</p>
        <p className="typo-caption text-text">
          예정된 근무 시간으로 계산한 금액이에요. 실제 지급 금액과 다를 수 있어요.
        </p>
      </section>

      <section className="flex gap-4">
        <div className="flex flex-1 flex-col gap-1">
          <p className="typo-caption text-text">일반 근무</p>
          <p className="typo-body-strong text-text-strong">
            {amountText(estimatedPay.regularAmount)}
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <p className="typo-caption text-text">리허설</p>
          <p className="typo-body-strong text-text-strong">
            {amountText(estimatedPay.rehearsalAmount)}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="typo-label text-text">날짜별 내역</h2>
        {estimatedPay.items.length === 0 ? (
          <p className="typo-body text-text">이번 달 내역이 아직 없어요</p>
        ) : (
          <ul className="flex flex-col">
            {estimatedPay.items.map((item, index) => (
              <li
                key={`${item.date}-${index}`}
                className="flex items-center justify-between border-b border-border py-2"
              >
                <span className="typo-body text-text-strong">
                  {item.date} · {item.label}
                </span>
                <span className="typo-body text-text-strong">{amountText(item.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="typo-label text-text">리허설 기록</h2>
          <Button variant="tertiary" onClick={() => setAddSheetOpen(true)}>
            리허설 기록 추가
          </Button>
        </div>
        <p className="typo-caption text-text">
          직접 작성한 참고 기록이며 공식 출퇴근 기록이 아니에요
        </p>
        <ul className="flex flex-col">
          {rehearsalEntries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => setEditingEntry(entry)}
                className="flex w-full items-center justify-between border-b border-border py-2 text-left"
              >
                <span className="typo-body text-text-strong">
                  {entry.date} · {entry.startTime}-{entry.endTime}
                </span>
                <span className="typo-body text-text-strong">{amountText(entry.amount)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <BottomSheet open={addSheetOpen} onOpenChange={setAddSheetOpen} title="리허설 기록 추가">
        <div className="flex flex-col gap-3 py-2">
          <Input
            label="날짜"
            placeholder="YYYY-MM-DD"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <Input
            label="시작 시각"
            placeholder="HH:MM"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
          <Input
            label="종료 시각"
            placeholder="HH:MM"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
          />
          <Button variant="primary" onClick={handleAdd} disabled={!date || !startTime || !endTime}>
            추가하기
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={editingEntry !== null}
        onOpenChange={(open) => {
          if (!open) setEditingEntry(null);
        }}
        title="리허설 기록"
      >
        {editingEntry ? (
          <div className="flex flex-col gap-3 py-2">
            <p className="typo-body text-text-strong">
              {editingEntry.date} · {editingEntry.startTime}-{editingEntry.endTime}
            </p>
            <Button variant="destructive" onClick={() => handleDelete(editingEntry)}>
              삭제하기
            </Button>
          </div>
        ) : null}
      </BottomSheet>
    </main>
  );
}
