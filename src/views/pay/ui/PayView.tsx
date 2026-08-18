"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type CSSProperties } from "react";

import type { EstimatedPay } from "@/entities/pay/model/estimated-pay";
import {
  calculateRehearsalAmount,
  MOCK_REHEARSAL_HOURLY_RATE,
  type RehearsalEntry,
} from "@/entities/pay/model/rehearsal-entry";
import { useReducedMotion } from "@/shared/hooks/useReducedMotion";
import { AnimatedAmount } from "@/shared/ui/animated-amount";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { showSnackbar } from "@/shared/ui/snackbar";
import { RouterPullToRefresh } from "@/widgets/pull-to-refresh/ui/RouterPullToRefresh";

type PayViewProps = {
  estimatedPay: EstimatedPay;
  rehearsalEntries: readonly RehearsalEntry[];
};

type RehearsalFormValues = {
  date: string;
  startTime: string;
  endTime: string;
};

const EMPTY_FORM: RehearsalFormValues = { date: "", startTime: "", endTime: "" };

function formatAmount(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function PayView({ estimatedPay, rehearsalEntries: initialRehearsalEntries }: PayViewProps) {
  const reducedMotion = useReducedMotion();
  const [hideAmount, setHideAmount] = useState(false);
  const [rehearsalEntries, setRehearsalEntries] = useState<RehearsalEntry[]>([
    ...initialRehearsalEntries,
  ]);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [addForm, setAddForm] = useState<RehearsalFormValues>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<RehearsalFormValues>(EMPTY_FORM);

  const editingEntry = rehearsalEntries.find((entry) => entry.id === editingId) ?? null;

  const rehearsalAmount = rehearsalEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalAmount = estimatedPay.regularAmount + rehearsalAmount;
  const items = [
    ...estimatedPay.items,
    ...rehearsalEntries.map((entry) => ({
      date: entry.date,
      label: "리허설",
      amount: entry.amount,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  function handleAdd() {
    const entry: RehearsalEntry = {
      id: `reh-${rehearsalEntries.length}-${addForm.date}-${addForm.startTime}`,
      date: addForm.date,
      startTime: addForm.startTime,
      endTime: addForm.endTime,
      hourlyRate: MOCK_REHEARSAL_HOURLY_RATE,
      amount: calculateRehearsalAmount(
        addForm.startTime,
        addForm.endTime,
        MOCK_REHEARSAL_HOURLY_RATE,
      ),
    };
    setRehearsalEntries((previous) => [...previous, entry]);
    setAddSheetOpen(false);
    setAddForm(EMPTY_FORM);
  }

  function openEdit(entry: RehearsalEntry) {
    setEditingId(entry.id);
    setEditForm({ date: entry.date, startTime: entry.startTime, endTime: entry.endTime });
  }

  function closeEdit() {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  }

  function handleSaveEdit() {
    if (!editingEntry) {
      return;
    }
    const target = editingEntry;
    setRehearsalEntries((previous) =>
      previous.map((entry) =>
        entry.id === target.id
          ? {
              ...entry,
              date: editForm.date,
              startTime: editForm.startTime,
              endTime: editForm.endTime,
              amount: calculateRehearsalAmount(
                editForm.startTime,
                editForm.endTime,
                entry.hourlyRate,
              ),
            }
          : entry,
      ),
    );
    closeEdit();
  }

  function handleDelete() {
    if (!editingEntry) {
      return;
    }
    const entry = editingEntry;
    setRehearsalEntries((previous) => previous.filter((item) => item.id !== entry.id));
    closeEdit();
    showSnackbar("리허설 기록을 삭제했어요", {
      action: {
        label: "되돌리기",
        onClick: () => setRehearsalEntries((previous) => [...previous, entry]),
      },
    });
  }

  const amountText = (amount: number) => (hideAmount ? "••••••" : formatAmount(amount));
  const animateAmount = !hideAmount && !reducedMotion;

  return (
    <RouterPullToRefresh>
      <main className="mx-auto flex min-h-dvh max-w-screen-sm flex-col gap-6 p-6 pb-nav-safe">
        <div className="flex items-center justify-between">
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
          <p className="typo-title text-text-strong tabular-nums">
            {hideAmount ? (
              "••••••"
            ) : (
              <AnimatedAmount value={totalAmount} animate={animateAmount} format={formatAmount} />
            )}
          </p>
          <p className="typo-caption text-text">
            예정된 근무 시간으로 계산한 금액이에요. 실제 지급 금액과 다를 수 있어요.
          </p>
        </section>

        <section className="flex gap-4">
          <div className="flex flex-1 flex-col gap-1">
            <p className="typo-caption text-text">일반 근무</p>
            <p className="typo-body-strong text-text-strong tabular-nums">
              {hideAmount ? (
                "••••••"
              ) : (
                <AnimatedAmount
                  value={estimatedPay.regularAmount}
                  animate={animateAmount}
                  format={formatAmount}
                />
              )}
            </p>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <p className="typo-caption text-text">리허설</p>
            <p className="typo-body-strong text-text-strong tabular-nums">
              {hideAmount ? (
                "••••••"
              ) : (
                <AnimatedAmount
                  value={rehearsalAmount}
                  animate={animateAmount}
                  format={formatAmount}
                />
              )}
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="typo-label text-text">날짜별 내역</h2>
          {items.length === 0 ? (
            <p className="typo-body text-text">이번 달 내역이 아직 없어요</p>
          ) : (
            <ul className="flex flex-col">
              {items.map((item, index) => (
                <li
                  key={`${item.date}-${item.label}-${index}`}
                  className="flex motion-stagger-item items-center justify-between border-b border-border py-2"
                  style={{ "--stagger-index": index } as CSSProperties}
                >
                  <span className="typo-body text-text-strong tabular-nums">
                    {item.date} · {item.label}
                  </span>
                  <span className="typo-body text-text-strong tabular-nums">
                    {amountText(item.amount)}
                  </span>
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
                  onClick={() => openEdit(entry)}
                  className="flex w-full items-center justify-between border-b border-border py-2 text-left"
                >
                  <span className="typo-body text-text-strong tabular-nums">
                    {entry.date} · {entry.startTime}-{entry.endTime}
                  </span>
                  <span className="typo-body text-text-strong tabular-nums">
                    {amountText(entry.amount)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <BottomSheet
          open={addSheetOpen}
          onOpenChange={(open) => {
            setAddSheetOpen(open);
            if (!open) setAddForm(EMPTY_FORM);
          }}
          title="리허설 기록 추가"
        >
          <div className="flex flex-col gap-3 py-2">
            <Input
              label="날짜"
              placeholder="YYYY-MM-DD"
              value={addForm.date}
              onChange={(event) =>
                setAddForm((previous) => ({ ...previous, date: event.target.value }))
              }
            />
            <Input
              label="시작 시각"
              placeholder="HH:MM"
              value={addForm.startTime}
              onChange={(event) =>
                setAddForm((previous) => ({ ...previous, startTime: event.target.value }))
              }
            />
            <Input
              label="종료 시각"
              placeholder="HH:MM"
              value={addForm.endTime}
              onChange={(event) =>
                setAddForm((previous) => ({ ...previous, endTime: event.target.value }))
              }
            />
            <Button
              variant="primary"
              onClick={handleAdd}
              disabled={!addForm.date || !addForm.startTime || !addForm.endTime}
            >
              추가하기
            </Button>
          </div>
        </BottomSheet>

        <BottomSheet
          open={editingEntry !== null}
          onOpenChange={(open) => {
            if (!open) closeEdit();
          }}
          title="리허설 기록 수정"
        >
          {editingEntry ? (
            <div className="flex flex-col gap-3 py-2">
              <Input
                label="날짜"
                value={editForm.date}
                onChange={(event) =>
                  setEditForm((previous) => ({ ...previous, date: event.target.value }))
                }
              />
              <Input
                label="시작 시각"
                value={editForm.startTime}
                onChange={(event) =>
                  setEditForm((previous) => ({ ...previous, startTime: event.target.value }))
                }
              />
              <Input
                label="종료 시각"
                value={editForm.endTime}
                onChange={(event) =>
                  setEditForm((previous) => ({ ...previous, endTime: event.target.value }))
                }
              />
              <div className="flex gap-2">
                <Button variant="primary" onClick={handleSaveEdit}>
                  저장하기
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  삭제하기
                </Button>
              </div>
            </div>
          ) : null}
        </BottomSheet>
      </main>
    </RouterPullToRefresh>
  );
}
