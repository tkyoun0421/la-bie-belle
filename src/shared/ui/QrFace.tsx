import { X } from "lucide-react-native";
import { Pressable, View, type ViewProps } from "react-native";
import { SvgXml } from "react-native-svg";
import { cn } from "@/shared/utils/cn";

const PAPER = "white";

const INK = "black";

const CLOSE_ICON_SIZE = 28;

const CLOSE_HIT_SLOP = 8;

function Code({ svg, size }: { svg: string | null; size?: number }) {
  if (svg === null) {
    return null;
  }

  return <SvgXml xml={svg} width={size ?? "100%"} height={size ?? "100%"} />;
}

export type QrCardProps = Omit<ViewProps, "children"> & {
  svg: string | null;
};

export function QrCard({ svg, className, ...rest }: QrCardProps) {
  return (
    <View
      style={{ backgroundColor: PAPER }}
      className={cn(
        "aspect-square w-full rounded-xl border border-stroke-neutral p-6",
        className,
      )}
      {...rest}
    >
      <Code svg={svg} />
    </View>
  );
}

export type QrStageProps = {
  svg: string | null;
  size: number;
  closeLabel: string;
  onClose: () => void;
  testID?: string;
};

export function QrStage({
  svg,
  size,
  closeLabel,
  onClose,
  testID,
}: QrStageProps) {
  return (
    <View
      testID={testID}
      style={{ backgroundColor: PAPER }}
      className="flex-1 items-center justify-center"
    >
      <Code svg={svg} size={size} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        onPress={onClose}
        hitSlop={CLOSE_HIT_SLOP}
        className="absolute top-6 right-6"
      >
        <X size={CLOSE_ICON_SIZE} color={INK} />
      </Pressable>
    </View>
  );
}
