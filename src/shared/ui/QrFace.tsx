import { X } from "lucide-react-native";
import { Pressable, View, type ViewProps } from "react-native";
import { SvgXml } from "react-native-svg";
import { cn } from "@/shared/utils/cn";

/**
 * QR이 앉는 흰 면이다. 값의 정본은
 * `docs/2-design/modules/attendance/screens/qr.md`의 「QR 색」과 「크게 띄우기」표다.
 *
 * **이 면만 팔레트 밖이다.** [tokens.md](../../../docs/2-design/design-system/tokens.md)가 모든
 * 면을 라이트와 다크 양쪽으로 정의하는데 여기만 늘 희다 — 코드를 반전하면 카메라가 못 읽는
 * 기기가 있다. 색 규칙이 아니라 기계 제약이라 역할 토큰이 없고, 그 예외를 화면이 아니라 이
 * 조각이 든다(lint 규칙 19).
 *
 * **그림은 벡터 하나다.** 화면과 인쇄용 종이가 같은 SVG 문자열을 받는다
 * (`src/screens/qr/utils/qrSvg.utils.ts`).
 *
 * `svg`가 `null`이면 면만 서고 그림 자리가 빈다 — 값이 오기 전의 모습이고 별도 문안이 없다
 * (`docs/2-design/spec/attendance-qr.md` 상태 격자의 「로딩」).
 */

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

/**
 * 화면 가운데에 크게 서는 정사각 카드다. 안쪽 여백이 넉넉한 것은 코드 둘레에 흰 띠가 있어야
 * 카메라가 경계를 잡기 때문이다.
 */
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

/**
 * 화면을 통째로 덮는 흰 면이다. 앱바가 없고 나가는 길은 오른쪽 위 닫기 하나뿐이다 — 앱바를
 * 두면 흰 면 위에 회색 띠가 얹혀 카메라가 잡는 면적이 준다. 닫기는 흰 면 위라 검은 아이콘이고
 * 그 글자는 접근성 라벨로만 선다.
 */
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
