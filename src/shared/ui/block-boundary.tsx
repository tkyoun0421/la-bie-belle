"use client";

import { useRouter } from "next/navigation";
import { Component } from "react";
import type { ReactNode } from "react";

type BlockBoundaryProps = {
  message: string;
  children: ReactNode;
};

type BlockBoundaryContentProps = BlockBoundaryProps & {
  onRetry: () => void | Promise<void>;
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

  handleRetry = (): void => {
    if (this.state.retrying) {
      return;
    }
    this.setState({ retrying: true, hasError: false });
    void Promise.resolve(this.props.onRetry()).finally(() => {
      this.setState({ retrying: false });
    });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex items-center justify-between gap-3 py-3">
        <p className="typo-body text-text-muted">{this.props.message}</p>
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

export function BlockBoundary({ message, children }: BlockBoundaryProps) {
  const router = useRouter();

  return (
    <BlockBoundaryContent message={message} onRetry={() => router.refresh()}>
      {children}
    </BlockBoundaryContent>
  );
}
