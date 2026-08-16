import { runDocsCheck } from "./docs-check.ts";
import { runHandoffGate } from "./handoff-gate.ts";
import { runIndexGate } from "./index-gate.ts";
import { runRadioGate } from "./radio-gate.ts";
import { runRetroGate } from "./retro-gate.ts";
import { runScopeGate } from "./scope-gate.ts";
import { runTddGate } from "./tdd-gate.ts";
import { runTokenParityGate } from "./token-parity.ts";
import type { Violation } from "./violation.ts";

type GateRunner = (root: string) => Violation[];

export type NamedGate = {
  readonly id: string;
  readonly run: GateRunner;
};

export const REPOSITORY_GATES: readonly NamedGate[] = [
  { id: "gate:index", run: runIndexGate },
  { id: "gate:radio", run: runRadioGate },
  { id: "gate:handoff", run: runHandoffGate },
  { id: "gate:tdd", run: runTddGate },
  { id: "gate:scope", run: runScopeGate },
  { id: "gate:retro", run: runRetroGate },
  { id: "gate:docs", run: runDocsCheck },
  { id: "gate:tokens", run: runTokenParityGate },
];

const COMMIT_GATES: readonly GateRunner[] = [
  runIndexGate,
  runRadioGate,
  runTddGate,
  runScopeGate,
  runRetroGate,
  runDocsCheck,
  runTokenParityGate,
];

const ALL_GATES: readonly GateRunner[] = REPOSITORY_GATES.map((gate) => gate.run);

function runGates(gates: readonly GateRunner[], root: string): Violation[] {
  return gates.flatMap((gate) => gate(root));
}

export function runCommitGates(root: string): Violation[] {
  return runGates(COMMIT_GATES, root);
}

export function runAllGates(root: string): Violation[] {
  return runGates(ALL_GATES, root);
}
