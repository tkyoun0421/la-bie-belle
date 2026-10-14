export const LOGIN_COPY = {
  brandMark: "라",
  serviceName: "라비에벨",
  tagline: "근무표와 급여를 한곳에서 봐요",
  notice: "가입하면 관리자가 확인한 뒤에\n근무표가 보여요",
  failure: "로그인하지 못했어요. 다시 눌러 주세요",
  googleLabel: "Sign in with Google",
};

export const GOOGLE_BUTTON_ASSETS: Readonly<
  Record<string, Readonly<Record<string, string>>>
> = {
  ios: { light: "ios-dark.svg", dark: "ios-light.svg" },
  android: { light: "android-dark.svg", dark: "android-light.svg" },
};

export const GOOGLE_BUTTON_ASPECT_RATIO: Readonly<Record<string, number>> = {
  ios: 188 / 44,
  android: 180 / 40,
};
