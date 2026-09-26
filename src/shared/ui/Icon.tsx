import type { LucideIcon, LucideProps } from "lucide-react-native";
import { styled } from "nativewind";
import type { ComponentType } from "react";

/**
 * lucide 아이콘을 className으로 칠하는 자리다.
 *
 * 아이콘 색은 옆 글자와 같은 `fg` 토큰을 따르고 아이콘만 다른 색으로 두지 않는다. lucide는
 * 색을 `color` prop으로 받아서 NativeWind의 className이 그대로 닿지 않는다 — `styled`가
 * 계산된 `color`를 그 prop으로 옮긴다.
 *
 * `fill`도 같이 옮긴다. lucide는 받은 `color`를 `stroke`에만 쓰고 자식 도형에는 안 내려서,
 * 면으로 그리는 자리(`fill-*`)가 `currentColor`를 적어도 그 색을 찾을 데가 없다 — 면이 빈
 * 채로 선다. 면을 쓰는 자리는 [탭 바](../../../docs/2-design/design-system/components.md)의
 * 지금 탭과 토스트 둘뿐이고, 둘 다 `text-*`와 `fill-*`을 같이 적는다.
 *
 * 크기는 옆 글자를 따라간다. 본문 옆이면 본문 크기, 부가 텍스트 옆이면 부가 텍스트 크기다.
 */

const BODY_ICON_SIZE = 20;

/**
 * `styled`는 부를 때마다 새 컴포넌트를 내므로 렌더 중에 부르면 아이콘이 매번 다시 마운트된다.
 * 아이콘 종류마다 한 번만 만들어 들고 있는다.
 */
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
  className?: string;
  fill?: string;
  strokeWidth?: number;
};

export function Icon({
  icon,
  size = BODY_ICON_SIZE,
  className = "text-fg-neutral",
  ...rest
}: IconProps) {
  const Styled = styledIcon(icon);

  return <Styled size={size} className={className} {...rest} />;
}
