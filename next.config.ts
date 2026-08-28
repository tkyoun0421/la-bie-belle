import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 빌드의 타입 검사는 앱 코드만 본다. TDD로 가면 테스트가 구현보다 먼저 생겨서,
  // 아직 없는 모듈을 import한 테스트 때문에 빌드가 통째로 깨진다. e2e는 빌드가
  // 있어야 도니 그 순간 손이 묶인다. 테스트까지 보는 검사는 pnpm typecheck가 맡고
  // CI가 그걸 따로 돌린다.
  typescript: { tsconfigPath: "tsconfig.build.json" },
};

export default nextConfig;
