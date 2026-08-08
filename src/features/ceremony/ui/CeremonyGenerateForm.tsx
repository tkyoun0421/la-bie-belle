"use client";

import { useState } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

type CeremonyGenerateFormProps = {
  onGenerate: (count: number, firstCeremonyTime: string) => void;
};

export function CeremonyGenerateForm({ onGenerate }: CeremonyGenerateFormProps) {
  const [count, setCount] = useState("1");
  const [firstCeremonyTime, setFirstCeremonyTime] = useState("10:00");

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        onGenerate(Number(count), firstCeremonyTime);
      }}
    >
      <Input
        label="예식 개수"
        type="number"
        inputMode="numeric"
        min={1}
        max={12}
        value={count}
        onChange={(event) => setCount(event.target.value)}
      />
      <Input
        label="첫 예식 시각"
        type="time"
        value={firstCeremonyTime}
        onChange={(event) => setFirstCeremonyTime(event.target.value)}
      />
      <Button type="submit" variant="primary">
        예식 목록 생성
      </Button>
    </form>
  );
}
