// `node --import ./scripts/register-module-alias.mjs`로 켠다. 해석 훅은 별도 스레드에서
// 돌아야 해서 등록만 여기서 하고 판정은 `module-alias-hooks.mjs`가 든다.

import { register } from "node:module";

register("./module-alias-hooks.mjs", import.meta.url);
