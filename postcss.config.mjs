/**
 * Expo의 Metro가 CSS를 넘기기 전에 이 파이프라인을 태운다. Tailwind 4는
 * 여기서 돌아 `globals.css`의 `@import`와 `@theme`을 실제 CSS로 편다.
 * 확장자가 `.mjs`인 이유는 Expo가 `.mjs`·`.js`·`.json`만 찾기 때문이다.
 */
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
