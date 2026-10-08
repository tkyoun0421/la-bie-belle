import type { LucideIcon, LucideProps } from "lucide-react-native";
import { styled } from "nativewind";
import type { ComponentType } from "react";
import { TONE_CLASS, type TextTone } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const BODY_ICON_SIZE = 20;

const styledIcons = new Map<LucideIcon, ComponentType<LucideProps>>();

function styledIcon(icon: LucideIcon): ComponentType<LucideProps> {
  const made = styledIcons.get(icon);

  if (made) {
    return made;
  }

  const styledComponent = styled(icon, {
    className: {
      target: false,
      nativeStyleMapping: { color: "color", fill: "fill" },
    },
  }) as ComponentType<LucideProps>;

  styledIcons.set(icon, styledComponent);

  return styledComponent;
}

export type IconProps = {
  icon: LucideIcon;
  size?: number;
  tone?: TextTone;
  className?: string;
  fill?: string;
  strokeWidth?: number;
  testID?: string;
};

export function Icon({
  icon,
  size = BODY_ICON_SIZE,
  tone = "neutral",
  className,
  ...rest
}: IconProps) {
  const Styled = styledIcon(icon);

  return (
    <Styled size={size} className={cn(TONE_CLASS[tone], className)} {...rest} />
  );
}
