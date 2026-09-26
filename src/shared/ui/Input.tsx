import { useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Text } from "@/shared/ui/Text";

/**
 * 글을 받는 칸이다. 라벨과 오류 문구와 글자 수가 칸을 둘러싼다.
 *
 * **오류 문구는 입력 아래에 붙인다.** 색만으로 오류를 알리지 않는다 — 색약인 사람에게는 테두리
 * 색 변화가 안 보인다. `error`에 문구가 있을 때만 테두리도 같이 바뀐다.
 *
 * **아직 쓰는 중인 것에는 오류 테두리를 안 쓴다.** 최소 글자 수에 못 미친다거나 하는 것은 아래
 * 도움말로만 알리고 테두리는 그대로 둔다. `error`는 사람이 보낸 뒤에 거절당한 자리에 준다.
 *
 * **글자 수는 상한까지 서른 자가 남았을 때 나타난다.** 상한이 100자든 200자든 같은 값이다 —
 * 남은 서른 자가 한 문장을 마칠 수 있는 길이라서고, 상한에 비례해 움직이면 화면마다 나타나는
 * 시점이 달라진다. 자리는 라벨 줄 오른쪽이고 라벨이 없는 칸이면 입력 아래 오른쪽이다. 매 글자
 * 바뀌는 숫자라 `tabular-nums`가 없으면 그 줄 전체가 떤다.
 *
 * 자리표시 글자로 라벨을 대신하지 않는다. 입력을 시작하면 사라져서 무엇을 넣는 칸이었는지 잊게
 * 된다.
 *
 * `className`은 칸이 아니라 칸과 라벨과 문구를 담는 바깥 상자가 받는다.
 */

const COUNTER_REMAINING = 30;

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({
  label,
  error,
  value,
  maxLength,
  onFocus,
  onBlur,
  className,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);

  const length = value?.length ?? 0;
  const remaining = maxLength === undefined ? null : maxLength - length;
  const counter =
    remaining !== null && remaining <= COUNTER_REMAINING ? (
      <Text
        className={cn(
          "text-xs tabular-nums",
          remaining <= 0
            ? "font-semibold text-fg-critical"
            : "text-fg-neutral-subtle",
        )}
      >
        {`${length}/${maxLength}`}
      </Text>
    ) : null;

  const border = error
    ? "border-bg-critical-solid"
    : focused
      ? "border-stroke-brand-solid"
      : "border-stroke-neutral";

  return (
    <View className={cn("gap-2", className)}>
      {label ? (
        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-sm text-fg-neutral-muted">{label}</Text>
          {counter}
        </View>
      ) : null}
      <TextInput
        value={value}
        maxLength={maxLength}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className={cn(
          "rounded-md border bg-bg-neutral-weak px-4 py-3 text-base text-fg-neutral placeholder:text-fg-neutral-subtle",
          border,
        )}
        {...rest}
      />
      {error ? <Text className="text-sm text-fg-critical">{error}</Text> : null}
      {label === undefined && counter !== null ? (
        <View className="items-end">{counter}</View>
      ) : null}
    </View>
  );
}
