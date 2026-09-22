/**
 * Expo Router의 라우트 타입 선언(`.expo/types/router.d.ts`)이 온전한지 본다.
 *
 * `expo-router`의 `Href`는 `ExpoRouter.__routes`가 빈 인터페이스면 `string | HrefObject`로
 * 떨어진다. 생성이 안 되거나 반쯤 되면 없는 경로를 적어도 `tsc`가 통과하는데, 그 상태와
 * 정상 상태가 종료 코드로는 구별되지 않는다 — 그래서 선언 자체를 읽어 판정한다.
 */

export type RouteTypesViolation =
  | { type: "missing-augmentation" }
  | { type: "missing-interface" }
  | { type: "missing-href" }
  | { type: "no-route-literal" };

const MODULE_AUGMENTATION = /declare\s+module\s+['"]expo-router['"]/;
const ROUTES_INTERFACE = /interface\s+__routes\b/;
const HREF_MEMBER = /^\s*href\s*:(.*)$/m;

/** `` `/login` ``처럼 백틱으로 묶인 절대 경로 하나라도 있으면 유니언이 실제로 섰다. */
const ROUTE_LITERAL = /`\//;

export function routeTypesViolations(
  declaration: string,
): RouteTypesViolation[] {
  const violations: RouteTypesViolation[] = [];

  if (!MODULE_AUGMENTATION.test(declaration)) {
    violations.push({ type: "missing-augmentation" });
  }

  if (!ROUTES_INTERFACE.test(declaration)) {
    violations.push({ type: "missing-interface" });
  }

  const href = HREF_MEMBER.exec(declaration);

  if (!href) {
    violations.push({ type: "missing-href" });

    return violations;
  }

  if (!ROUTE_LITERAL.test(href[1])) {
    violations.push({ type: "no-route-literal" });
  }

  return violations;
}

export function describeRouteTypesViolation(
  violation: RouteTypesViolation,
): string {
  switch (violation.type) {
    case "missing-augmentation":
      return '`declare module "expo-router"` 보강이 없다';
    case "missing-interface":
      return "`ExpoRouter.__routes` 인터페이스가 없다";
    case "missing-href":
      return "`href` 멤버가 없다";
    case "no-route-literal":
      return "`href`에 경로 리터럴이 하나도 없다 — `Href`가 `string`으로 떨어진다";
  }
}
