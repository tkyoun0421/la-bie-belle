export function readAppUrl(): string {
  const value = process.env.EXPO_PUBLIC_APP_URL;

  if (!value) {
    throw new Error(
      "환경 변수 EXPO_PUBLIC_APP_URL 값이 비어 있다. EXPO_PUBLIC_* 값은 빌드 시점에 번들에 박히니, 배포 환경에 값을 채우고 다시 빌드해야 한다.",
    );
  }

  return value;
}
