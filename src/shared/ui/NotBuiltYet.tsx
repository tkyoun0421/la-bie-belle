import { Text, View } from "react-native";

export function NotBuiltYet({ path }: { path: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-bg-neutral px-6">
      <Text className="font-medium text-base text-fg-neutral">아직 없다</Text>
      <Text className="text-sm text-fg-neutral-subtle">{path}</Text>
    </View>
  );
}
