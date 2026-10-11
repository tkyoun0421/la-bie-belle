import type { ReactNode } from "react";

type FragmentState = "pending" | "failed" | "empty" | "ready";

type AnyFragment = { state: FragmentState };

type BranchOf<Fragment, State extends FragmentState> = Extract<
  Fragment,
  { state: State }
>;

type Shown<Branch> = ReactNode | ((branch: Branch) => ReactNode);

function isBranch<Fragment extends AnyFragment, State extends FragmentState>(
  fragment: Fragment,
  state: State,
): fragment is BranchOf<Fragment, State> {
  return fragment.state === state;
}

function nodeOf<Branch>(shown: Shown<Branch>, branch: Branch): ReactNode {
  return typeof shown === "function" ? shown(branch) : (shown ?? null);
}

export type FragmentViewProps<Fragment extends AnyFragment> = {
  fragment: Fragment;
  pending?: ReactNode;
  failed?: Shown<BranchOf<Fragment, "failed">>;
  empty?: Shown<BranchOf<Fragment, "empty">>;
  children: (ready: BranchOf<Fragment, "ready">) => ReactNode;
};

export function FragmentView<Fragment extends AnyFragment>({
  fragment,
  pending,
  failed,
  empty,
  children,
}: FragmentViewProps<Fragment>) {
  if (isBranch(fragment, "ready")) {
    return children(fragment);
  }

  if (isBranch(fragment, "failed")) {
    return nodeOf(failed, fragment);
  }

  if (isBranch(fragment, "empty")) {
    return nodeOf(empty, fragment);
  }

  return pending ?? null;
}
