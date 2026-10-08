import { useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

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
