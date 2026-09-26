import { Pressable, View, type ViewProps } from "react-native";
import { cn } from "@/shared/lib/utils";
import { Text } from "@/shared/ui/Text";

/**
 * 화면 위쪽에 깔려 화면을 가르는 탭이다. 누르면 아래 내용이 다른 화면으로 바뀐다 — 같은 자료를
 * 다른 눈금으로 다시 세우는 자리는 여기가 아니라 `Segment`다.
 *
 * 활성 탭은 브랜드 색이 나가는 세 자리 중 하나고 밑줄과 글자 둘 다 브랜드 색을 쓴다. 활성 탭
 * 배경을 옅은 브랜드 면으로 채우지 않는다 — 탭 바가 넓게 깔려서 면으로 칠하면 브랜드 색 면적이
 * 버튼보다 커진다.
 *
 * 비활성 탭도 같은 두께의 밑줄을 투명으로 들고 있는다. 활성 탭에만 선을 주면 그 줄만 2px
 * 밀려 글자 기준선이 탭마다 어긋난다.
 */

export type TabItem = {
  value: string;
  label: string;
};

export type TabsProps = Omit<ViewProps, "children"> & {
  items: readonly TabItem[];
  value: string;
  onChange: (value: string) => void;
  testID?: string;
};

export function Tabs({
  items,
  value,
  onChange,
  className,
  testID,
  ...rest
}: TabsProps) {
  return (
    <View
      testID={testID}
      accessibilityRole="tablist"
      className={cn("flex-row border-b border-stroke-neutral", className)}
      {...rest}
    >
      {items.map((item) => {
        const active = item.value === value;

        return (
          <Pressable
            key={item.value}
            testID={testID ? `${testID}-${item.value}` : undefined}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(item.value)}
            className={cn(
              "min-h-11 flex-1 items-center justify-center border-b-2 px-4",
              active ? "border-stroke-brand-solid" : "border-transparent",
            )}
          >
            <Text
              className={cn(
                "text-base",
                active ? "text-fg-brand" : "text-fg-neutral-subtle",
              )}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
