import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { type ReactNode, useCallback } from "react";
import { BottomSheet } from "@/shared/ui/BottomSheet";

/**
 * 손짓으로 끌어 올리고 내리는 시트다. 열려 있는 동안 화면 아래에 붙어 있고 스냅 자리는
 * 부르는 쪽이 정한다.
 *
 * 손짓과 스냅만 `@gorhom/bottom-sheet`에서 온다 — v5부터 Reanimated v4와 새 아키텍처를
 * 받고, v4 이하를 들이면 시트가 손짓에 반응하지 않는다
 * (`docs/2-design/design-system/components.md` 「어디서 오는가」). 모양은 그쪽 것을 안 쓰고
 * `BottomSheet`가 그대로 준다 — 그래서 컨테이너 면을 투명으로 눕히고 우리 면을 그 안에
 * 세운다. 손잡이도 지운다: 이 디렉터리가 시트 위에 손잡이를 두라고 한 적이 없다.
 *
 * 덮개는 `bg.scrim`이 투명도를 이미 들고 있어 따로 얹지 않는다.
 */

const TRANSPARENT = { backgroundColor: "transparent" } as const;

export type DraggableSheetProps = {
  snapPoints: (string | number)[];
  index?: number;
  onClose?: () => void;
  children: ReactNode;
};

export function DraggableSheet({
  snapPoints,
  index = 0,
  onClose,
  children,
}: DraggableSheetProps) {
  const backdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    [],
  );

  return (
    <GorhomBottomSheet
      index={index}
      snapPoints={snapPoints}
      onClose={onClose}
      enablePanDownToClose
      backdropComponent={backdrop}
      backgroundStyle={TRANSPARENT}
      handleComponent={null}
      style={TRANSPARENT}
    >
      <BottomSheetView>
        <BottomSheet>{children}</BottomSheet>
      </BottomSheetView>
    </GorhomBottomSheet>
  );
}
