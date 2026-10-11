type FragmentRead = {
  data: unknown;
  error: Error | null;
};

type DataOf<Read> = Read extends { data: infer Data }
  ? Exclude<Data, undefined>
  : never;

type DataListOf<Reads> = { [At in keyof Reads]: DataOf<Reads[At]> };

type BeforeData<Failed> = { state: "pending" } | ({ state: "failed" } & Failed);

type Fragment<Ready, Failed> =
  BeforeData<Failed> | ({ state: "ready" } & Ready);

type FragmentWithEmpty<Ready, Empty, Failed> =
  | BeforeData<Failed>
  | ({ state: "empty" } & Empty)
  | ({ state: "ready" } & Ready);

type ReadyAsked<Data, Ready, Failed> = {
  ready(data: Data): Ready;
  failed?(): Failed;
};

type EmptyAsked<Data, Empty> = {
  empty(data: Data): boolean;
  emptyValue?(): Empty;
};

type NoBranchValue = Record<never, never>;

type Reads = readonly [FragmentRead, ...FragmentRead[]];

function isList(
  given: FragmentRead | readonly FragmentRead[],
): given is readonly FragmentRead[] {
  return Array.isArray(given);
}

export function fragmentOf<
  Read extends FragmentRead,
  Ready extends object,
  Empty extends object = NoBranchValue,
  Failed extends object = NoBranchValue,
>(
  read: Read,
  branches: ReadyAsked<DataOf<Read>, Ready, Failed> &
    EmptyAsked<DataOf<Read>, Empty>,
): FragmentWithEmpty<Ready, Empty, Failed>;

export function fragmentOf<
  Read extends FragmentRead,
  Ready extends object,
  Failed extends object = NoBranchValue,
>(
  read: Read,
  branches: ReadyAsked<DataOf<Read>, Ready, Failed>,
): Fragment<Ready, Failed>;

export function fragmentOf<
  Given extends Reads,
  Ready extends object,
  Empty extends object = NoBranchValue,
  Failed extends object = NoBranchValue,
>(
  reads: Given,
  branches: ReadyAsked<DataListOf<Given>, Ready, Failed> &
    EmptyAsked<DataListOf<Given>, Empty>,
): FragmentWithEmpty<Ready, Empty, Failed>;

export function fragmentOf<
  Given extends Reads,
  Ready extends object,
  Failed extends object = NoBranchValue,
>(
  reads: Given,
  branches: ReadyAsked<DataListOf<Given>, Ready, Failed>,
): Fragment<Ready, Failed>;

export function fragmentOf(
  given: FragmentRead | readonly FragmentRead[],
  branches: {
    ready(data: unknown): object;
    failed?(): object;
    empty?(data: unknown): boolean;
    emptyValue?(): object;
  },
): { state: string } {
  const asked = isList(given) ? given : [given];

  if (asked.some((read) => read.error !== null)) {
    return { state: "failed", ...branches.failed?.() };
  }

  if (asked.some((read) => read.data === undefined)) {
    return { state: "pending" };
  }

  const data = isList(given) ? asked.map((read) => read.data) : given.data;

  if (branches.empty?.(data) === true) {
    return { state: "empty", ...branches.emptyValue?.() };
  }

  return { state: "ready", ...branches.ready(data) };
}
