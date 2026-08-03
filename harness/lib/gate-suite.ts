import { runHandoffGate } from "./handoff-gate.ts";
import { runIndexGate } from "./index-gate.ts";
import { runRadioGate } from "./radio-gate.ts";
import { runScopeGate } from "./scope-gate.ts";
import { runTddGate } from "./tdd-gate.ts";
import type { Violation } from "./violation.ts";

type GateRunner = (root: string) => Violation[];

/** Gates that a commit must satisfy. Runs every gate so all violations surface at once. */
const COMMIT_GATES: readonly GateRunner[] = [runIndexGate, runRadioGate, runTddGate, runScopeGate];

/** Gates that `gate:all` runs. commit-msg needs a message file, so it is hook only. */
const ALL_GATES: readonly GateRunner[] = [runIndexGate, runRadioGate, runHandoffGate, runTddGate, runScopeGate];

function runGates(gates: readonly GateRunner[], root: string): Violation[] {
  return gates.flatMap((gate) => gate(root));
}

export function runCommitGates(root: string): Violation[] {
  return runGates(COMMIT_GATES, root);
}

export function runAllGates(root: string): Violation[] {
  return runGates(ALL_GATES, root);
}
