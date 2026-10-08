import { Image, View, type DimensionValue, type ViewProps } from "react-native";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const CIRCLE_SIZE = 112;

const CONFETTI: {
  top: DimensionValue;
  left: DimensionValue;
  tone: string;
  round: boolean;
}[] = [
  { top: "-8%", left: "46%", tone: "bg-bg-brand-solid", round: true },
  { top: "2%", left: "-6%", tone: "bg-bg-brand-muted", round: false },
  { top: "4%", left: "98%", tone: "bg-stroke-neutral-muted", round: true },
  { top: "44%", left: "-12%", tone: "bg-bg-brand-solid", round: false },
  { top: "46%", left: "106%", tone: "bg-bg-brand-muted", round: true },
  { top: "90%", left: "0%", tone: "bg-stroke-neutral-muted", round: false },
  { top: "100%", left: "52%", tone: "bg-bg-brand-solid", round: true },
  { top: "88%", left: "96%", tone: "bg-bg-brand-muted", round: false },
];

export type CelebrationCircleProps = ViewProps & {
  name: string;
  photoUrl?: string | null;
};

export function CelebrationCircle({
  name,
  photoUrl,
  className,
  style,
  testID,
  ...rest
}: CelebrationCircleProps) {
  const initial = Array.from(name.trim())[0] ?? "";

  return (
    <View testID={testID} className={className} style={style} {...rest}>
      <View
        style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
        className="items-center justify-center overflow-hidden rounded-full bg-bg-brand-weak"
      >
        {photoUrl ? (
          <Image
            testID={testID ? `${testID}-photo` : undefined}
            source={{ uri: photoUrl }}
            style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
          />
        ) : (
          <Text size="4xl" weight="semibold" tone="brand">
            {initial}
          </Text>
        )}
      </View>

      {CONFETTI.map((piece) => (
        <View
          key={`${String(piece.top)}-${String(piece.left)}`}
          style={{ top: piece.top, left: piece.left }}
          className={cn(
            "absolute size-1.5",
            piece.round ? "rounded-full" : "rounded-xs",
            piece.tone,
          )}
        />
      ))}
    </View>
  );
}
