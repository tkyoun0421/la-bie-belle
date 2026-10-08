export type RouteTypesViolation =
  | { type: "missing-augmentation" }
  | { type: "missing-interface" }
  | { type: "missing-href" }
  | { type: "no-route-literal" };

const MODULE_AUGMENTATION = /declare\s+module\s+['"]expo-router['"]/;
const ROUTES_INTERFACE = /interface\s+__routes\b/;
const HREF_MEMBER = /^\s*href\s*:(.*)$/m;

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
