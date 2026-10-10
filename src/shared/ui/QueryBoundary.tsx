import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Component, Suspense, type ReactNode } from "react";

type CatchProps = {
  onReset: () => void;
  failed: (retry: () => void) => ReactNode;
  children: ReactNode;
};

type CatchState = {
  caught: boolean;
};

class Catch extends Component<CatchProps, CatchState> {
  state: CatchState = { caught: false };

  static getDerivedStateFromError(): CatchState {
    return { caught: true };
  }

  retry = () => {
    this.props.onReset();
    this.setState({ caught: false });
  };

  render() {
    if (this.state.caught) {
      return this.props.failed(this.retry);
    }

    return this.props.children;
  }
}

export type QueryBoundaryProps = {
  pending: ReactNode;
  failed: (retry: () => void) => ReactNode;
  children: ReactNode;
};

export function QueryBoundary({
  pending,
  failed,
  children,
}: QueryBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <Catch onReset={reset} failed={failed}>
          <Suspense fallback={pending}>{children}</Suspense>
        </Catch>
      )}
    </QueryErrorResetBoundary>
  );
}
