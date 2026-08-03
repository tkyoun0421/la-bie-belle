/**
 * Minimal JSON Schema validator covering exactly the keyword subset that
 * `docs/execution/phases/index.schema.json` uses. No external dependency.
 *
 * Any keyword outside that subset is reported as an error instead of being
 * ignored, so extending the schema can never silently weaken the index gate.
 */
import { isPlainObject } from "./json-value.ts";

type SchemaObject = Readonly<Record<string, unknown>>;

const ANNOTATION_KEYWORDS: ReadonlySet<string> = new Set([
  "$schema",
  "$id",
  "title",
  "description",
  "$defs",
]);

const SUPPORTED_KEYWORDS: ReadonlySet<string> = new Set([
  "$ref",
  "type",
  "const",
  "enum",
  "pattern",
  "minLength",
  "minimum",
  "minItems",
  "uniqueItems",
  "items",
  "format",
  "required",
  "properties",
  "additionalProperties",
  "allOf",
  "if",
  "then",
  "not",
]);

const DATE_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

function label(path: string): string {
  return path.length === 0 ? "(최상위)" : path;
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function typeMatches(type: string, data: unknown): boolean {
  switch (type) {
    case "object":
      return isPlainObject(data);
    case "array":
      return Array.isArray(data);
    case "string":
      return typeof data === "string";
    case "integer":
      return typeof data === "number" && Number.isInteger(data);
    case "number":
      return typeof data === "number";
    case "boolean":
      return typeof data === "boolean";
    default:
      return false;
  }
}

function isCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function resolveRef(ref: string, root: unknown): { schema: unknown } | { error: string } {
  if (!ref.startsWith("#/")) {
    return { error: `외부 $ref "${ref}"는 지원하지 않습니다.` };
  }
  let current: unknown = root;
  for (const rawSegment of ref.slice(2).split("/")) {
    const segment = rawSegment.replace(/~1/g, "/").replace(/~0/g, "~");
    if (!isPlainObject(current) || !(segment in current)) {
      return { error: `$ref "${ref}"를 찾을 수 없습니다.` };
    }
    current = current[segment];
  }
  return { schema: current };
}

function validateNode(schema: unknown, data: unknown, path: string, root: unknown): string[] {
  if (!isPlainObject(schema)) {
    return [`${label(path)}: 스키마 노드가 객체가 아닙니다.`];
  }
  const node: SchemaObject = schema;
  const errors: string[] = [];

  for (const keyword of Object.keys(node)) {
    if (!ANNOTATION_KEYWORDS.has(keyword) && !SUPPORTED_KEYWORDS.has(keyword)) {
      errors.push(
        `${label(path)}: 지원하지 않는 스키마 keyword "${keyword}"입니다. harness/lib/json-schema.ts에 규칙을 추가하세요.`,
      );
    }
  }

  if (typeof node["$ref"] === "string") {
    const resolved = resolveRef(node["$ref"], root);
    if ("error" in resolved) {
      errors.push(`${label(path)}: ${resolved.error}`);
    } else {
      errors.push(...validateNode(resolved.schema, data, path, root));
    }
  }

  const type = node["type"];
  if (typeof type === "string" && !typeMatches(type, data)) {
    errors.push(`${label(path)}: 타입이 ${type}이어야 합니다.`);
    return errors;
  }

  if ("const" in node && !sameValue(node["const"], data)) {
    errors.push(`${label(path)}: 값이 ${JSON.stringify(node["const"])}이어야 합니다.`);
  }

  const enumValues = node["enum"];
  if (Array.isArray(enumValues) && !enumValues.some((candidate) => sameValue(candidate, data))) {
    errors.push(`${label(path)}: 허용된 값 ${JSON.stringify(enumValues)} 중 하나여야 합니다.`);
  }

  if (typeof data === "string") {
    const pattern = node["pattern"];
    if (typeof pattern === "string" && !new RegExp(pattern, "u").test(data)) {
      errors.push(`${label(path)}: 값 "${data}"가 패턴 ${pattern}과 맞지 않습니다.`);
    }
    const minLength = node["minLength"];
    if (typeof minLength === "number" && data.length < minLength) {
      errors.push(`${label(path)}: 문자열 길이가 ${minLength} 이상이어야 합니다.`);
    }
    const format = node["format"];
    if (typeof format === "string") {
      if (format !== "date") {
        errors.push(`${label(path)}: 지원하지 않는 format "${format}"입니다.`);
      } else if (!isCalendarDate(data)) {
        errors.push(`${label(path)}: 값 "${data}"가 YYYY-MM-DD 날짜 형식이 아닙니다.`);
      }
    }
  }

  const minimum = node["minimum"];
  if (typeof data === "number" && typeof minimum === "number" && data < minimum) {
    errors.push(`${label(path)}: 값이 ${minimum} 이상이어야 합니다.`);
  }

  if (Array.isArray(data)) {
    const minItems = node["minItems"];
    if (typeof minItems === "number" && data.length < minItems) {
      errors.push(`${label(path)}: 원소가 ${minItems}개 이상이어야 합니다.`);
    }
    if (node["uniqueItems"] === true) {
      const seen = data.map((item) => JSON.stringify(item));
      if (new Set(seen).size !== seen.length) {
        errors.push(`${label(path)}: 원소가 중복될 수 없습니다.`);
      }
    }
    const items = node["items"];
    if (items !== undefined) {
      data.forEach((item, itemIndex) => {
        errors.push(...validateNode(items, item, `${path}/${itemIndex}`, root));
      });
    }
  }

  if (isPlainObject(data)) {
    const required = node["required"];
    if (Array.isArray(required)) {
      for (const key of required) {
        if (typeof key === "string" && !(key in data)) {
          errors.push(`${label(path)}: 필수 필드 "${key}"가 없습니다.`);
        }
      }
    }
    const properties = node["properties"];
    if (isPlainObject(properties)) {
      for (const [key, childSchema] of Object.entries(properties)) {
        if (key in data) {
          errors.push(...validateNode(childSchema, data[key], `${path}/${key}`, root));
        }
      }
    }
    if ("additionalProperties" in node) {
      if (node["additionalProperties"] !== false) {
        errors.push(`${label(path)}: additionalProperties는 false만 지원합니다.`);
      } else {
        const declared = isPlainObject(properties) ? Object.keys(properties) : [];
        for (const key of Object.keys(data)) {
          if (!declared.includes(key)) {
            errors.push(`${label(path)}: 스키마에 정의되지 않은 필드 "${key}"가 있습니다.`);
          }
        }
      }
    }
  }

  const allOf = node["allOf"];
  if (Array.isArray(allOf)) {
    for (const subSchema of allOf) {
      errors.push(...validateNode(subSchema, data, path, root));
    }
  }

  if ("if" in node) {
    const conditionErrors = validateNode(node["if"], data, path, root);
    if (conditionErrors.length === 0 && "then" in node) {
      errors.push(...validateNode(node["then"], data, path, root));
    }
  }

  if ("not" in node && validateNode(node["not"], data, path, root).length === 0) {
    errors.push(`${label(path)}: 금지된 조건(not)을 만족합니다.`);
  }

  return errors;
}

/** Returns Korean error descriptions; an empty array means the data is valid. */
export function validateAgainstSchema(schema: unknown, data: unknown, path = ""): string[] {
  return validateNode(schema, data, path, schema);
}
