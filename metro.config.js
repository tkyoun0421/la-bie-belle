const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// CSS 진입점을 여기서 안 가리킨다 — v5는 앱이 import한 CSS를 따라간다.
// 그 import는 `src/app/_layout.tsx`에 한 번 있다.
module.exports = withNativewind(config);
