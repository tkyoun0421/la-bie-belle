"use client";

import { useRouter } from "next/navigation";
import { Component } from "react";
import type { ReactNode } from "react";

type BlockBoundaryProps = {
  name: string;
  children: ReactNode;
};

type BlockBoundaryContentProps = BlockBoundaryProps & {
  onRetry: () => void;
};

type BlockBoundaryContentState = {
  hasError: boolean;
  retrying: boolean;
};

class BlockBoundaryContent extends Component<BlockBoundaryContentProps, BlockBoundaryContentState> {
  state: BlockBoundaryContentState = { hasError: false, retrying: false };

  static getDerivedStateFromError(): Pick<BlockBoundaryContentState, "hasError"> {
    return { hasError: true };
  }

  componentDidUpdate(
    _prevProps: BlockBoundaryContentProps,
    prevState: BlockBoundaryContentState,
  ): void {
    if (prevState.hasError && !this.state.hasError && this.state.retrying) {
      this.setState({ retrying: false });
    }
  }

  handleRetry = (): void => {
    if (this.state.retrying) {
      return;
    }
    this.setState({ retrying: true, hasError: false });
    this.props.onRetry();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex items-center justify-between gap-3 py-3">
        <p className="typo-body text-text-muted">{`${this.props.name}을 불러오지 못했어요`}</p>
        <button
          type="button"
          onClick={this.handleRetry}
          disabled={this.state.retrying}
          className="rounded-pill border border-border px-3 py-1.5 typo-caption-strong text-text disabled:opacity-60"
        >
          다시 시도
        </button>
      </div>
    );
  }
}

export function BlockBoundary({ name, children }: BlockBoundaryProps) {
  const router = useRouter();

  return (
    <BlockBoundaryContent name={name} onRetry={() => router.refresh()}>
      {children}
    </BlockBoundaryContent>
  );
}
