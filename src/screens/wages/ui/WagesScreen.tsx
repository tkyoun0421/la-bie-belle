import { ScrollView, View } from "react-native";
import { AppBar } from "@/shared/ui/AppBar";
import { Divider } from "@/shared/ui/Divider";
import { FloatingToast } from "@/shared/ui/FloatingToast";
import { ListRow } from "@/shared/ui/ListRow";
import { Screen } from "@/shared/ui/Screen";
import { Text } from "@/shared/ui/Text";
import { WAGES_COPY } from "@/screens/wages/consts/wages.const";
import { useWagesScreen } from "@/screens/wages/hooks/useWagesScreen";
import { WagesList } from "@/screens/wages/ui/WagesList";
import { WagesSheets } from "@/screens/wages/ui/WagesSheets";

export function WagesScreen() {
  const screen = useWagesScreen();

  return (
    <Screen floor="plain">
      <AppBar title={WAGES_COPY.appBarTitle} onBack={screen.goBack} />

      <ScrollView>
        <View className="px-5 pb-5">
          <View>
            <ListRow
              title={WAGES_COPY.baseTitle}
              value={screen.baseValue}
              chevron
              onPress={screen.openBase}
            />
            <Text size="xs" tone="subtle" numeric className="mt-1">
              {screen.baseNote}
            </Text>
          </View>

          <Divider className="my-2" />

          <WagesList screen={screen} />
        </View>
      </ScrollView>

      <WagesSheets screen={screen} />

      {screen.toast ? (
        <FloatingToast
          kind={screen.toast.kind}
          message={screen.toast.message}
          onDone={screen.dismissToast}
        />
      ) : null}
    </Screen>
  );
}
