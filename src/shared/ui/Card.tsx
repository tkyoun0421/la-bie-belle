import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

export type CardProps = ViewProps;

export function Card({ className, children, testID, ...rest }: CardProps) {
  return (
    <View
      testID={testID}
      className={cn("rounded-xl bg-bg-neutral p-5 shadow-card", className)}
      {...rest}
    >
      {children}
    </View>
  );
}

export type CardHeaderProps = ViewProps & {
  title: string;
  leading?: ReactNode;
};

export function CardHeader({
  title,
  leading,
  className,
  children,
  testID,
  ...rest
}: CardHeaderProps) {
  return (
    <View
      testID={testID}
      className={cn("flex-row items-center gap-2", className)}
      {...rest}
    >
      {leading}
      <Text className="font-semibold text-lg text-fg-neutral">{title}</Text>
      {children}
    </View>
  );
}
