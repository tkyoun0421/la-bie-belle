const { components, logic } = require("./jest.projects.js");

// 갈래 둘이 나란히 돈다. 계산과 문서 검사는 node 프리셋 위에서, 조각 렌더는 iOS 프리셋
// 위에서 — 갈래를 가른 이유는 `jest.projects.js`가 든다.
/** @type {import('jest').Config} */
module.exports = { projects: [logic, components] };
