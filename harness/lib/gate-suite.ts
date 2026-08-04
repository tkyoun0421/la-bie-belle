import { runHandoffGate } from "./handoff-gate.ts";
import { runIndexGate } from "./index-gate.ts";
import { runRadioGate } from "./radio-gate.ts";
import { runScopeGate } from "./scope-gate.ts";
import { runTddGate } from "./tdd-gate.ts";
import type { Violation } from "./violation.ts";

type GateRunner = (root: string) => Violation[];

/** A repository gate together with the id used in package.json scripts. */
export type NamedGate = {
  readonly id: string;
  readonly run: GateRunner;
};

/**
 * Every gate that judges the repository as it stands. Consumers that need
 * per-gate results (the dashboard's contract compliance score) read this list
 * instead of re-declaring which gates exist.
 *
 * commit-msg is not here: it judges a message, not the repository.
 */
export const REPOSITORY_GATES: readonly NamedGate[] = [
  { id: "gate:index", run: runIndexGate },
  { id: "gate:radio", run: runRadioGate },
  { id: "gate:handoff", run: runHandoffGate },
  { id: "gate:tdd", run: runTddGate },
  { id: "gate:scope", run: runScopeGate },
];

/** Gates that a commit must satisfy. Runs every gate so all violations surface at once. */
const COMMIT_GATES: readonly GateRunner[] = [runIndexGate, runRadioGate, runTddGate, runScopeGate];

/** Gates that `gate:all` runs. commit-msg needs a message file, so it is hook only. */
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
