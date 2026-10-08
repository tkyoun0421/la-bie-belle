import { useCallback, type ReactNode } from "react";
import { View, type ViewProps } from "react-native";
import { useDrag, useDropState } from "@/shared/stores/drag.context";
import { cn } from "@/shared/utils/cn";

export type DropTargetProps = ViewProps & {
  id: string;
  children: ReactNode;
};

export function DropTarget({
  id,
  className,
  children,
  ...rest
}: DropTargetProps) {
  const { registerTarget } = useDrag();
  const state = useDropState(id);

  const attach = useCallback(
    (view: View | null) => registerTarget(id, view),
    [id, registerTarget],
  );

  return (
    <View
      ref={attach}
      className={cn(
        state === "over" && "rounded-lg border border-stroke-brand-solid",
        className,
      )}
      {...rest}
    >
      {children}
    </View>
  );
}
