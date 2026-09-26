import { Image, View, type DimensionValue, type ViewProps } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Text } from "@/shared/ui/Text";

/**
 * 축하하는 순간에 화면 한가운데로 튀어나오는 큰 원이다. 프로필을 처음 보낸 순간이 그
 * 자리고([login.md]의 「보낸 뒤」), 원 둘레에서 조각 여덟이 터진다.
 *
 * **[Avatar](Avatar.tsx)가 아니다.** 그 조각의 크기 셋(24·40·64)은 목록 줄과 픽커와 프로필
 * 머리라는 서는 자리 셋에서 나왔고, 여기는 그 셋 중 어디도 아니다 — 계정마다 한 번 지나가는
 * 한 장이라 크기를 그쪽에 넷째로 더하면 안 쓰는 자리가 하나 는다. 대신 사진이 없을 때 이름
 * 첫 글자를 세우는 결은 Avatar와 같게 둔다.
 *
 * **조각은 작고 적고 멀리 안 간다.** 원 지름의 절반쯤 바깥까지고 여덟뿐이라, 화면 전체가
 * 아니라 얼굴 둘레만 한 번 반짝이는 정도다. 색 셋을 섞는 것은 한 색이면 무늬로 읽혀서고,
 * 중립 조각이 선 토큰의 색을 면에 쓰는 것은 그 자리에 맞는 면 토큰이 없어서다.
 */

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
