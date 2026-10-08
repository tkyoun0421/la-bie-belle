import Constants from "expo-constants";

export function readIsExpoGo(): boolean {
  return Constants.executionEnvironment === "storeClient";
}

export function readExpoHostUri(): string | undefined {
  return Constants.expoConfig?.hostUri;
}
