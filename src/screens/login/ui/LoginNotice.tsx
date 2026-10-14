import { View } from "react-native";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";
import { LOGIN_COPY } from "@/screens/login/consts/login.const";

export type LoginNoticeProps = {
  failed: boolean;
};

export function LoginNotice({ failed }: LoginNoticeProps) {
  return (
    <View className="mt-4 self-stretch">
      <Text
        size="xs"
        tone="subtle"
        className={cn("text-center", failed && "opacity-0")}
        accessibilityElementsHidden={failed}
        importantForAccessibility={failed ? "no-hide-descendants" : "auto"}
      >
        {LOGIN_COPY.notice}
      </Text>
      {failed ? (
        <Text
          size="xs"
          tone="critical"
          accessibilityRole="alert"
          className="absolute inset-x-0 top-0 text-center"
        >
          {LOGIN_COPY.failure}
        </Text>
      ) : null}
    </View>
  );
}
