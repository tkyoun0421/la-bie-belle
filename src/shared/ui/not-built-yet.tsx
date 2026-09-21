import { Text, View } from "react-native";

/**
 * 골격이 세운 빈 화면이다. 그 경로의 화면 task가 이 자리를 가져간다.
 * 라우팅과 층이 제대로 섰는지를 눈으로 보려고 경로를 같이 적는다.
 */
export function NotBuiltYet({ path }: { path: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-bg-neutral px-6">
      <Text className="font-medium text-base text-fg-neutral">아직 없다</Text>
      <Text className="text-sm text-fg-neutral-subtle">{path}</Text>
    </View>
  );
}
