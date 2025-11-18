"use client";

import React from "react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  onRetry?: () => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[300px] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center text-[#3D3D3D] shadow-sm">
            <h2 className="text-lg font-semibold">Something went wrong. Please try again.</h2>
            <p className="mt-2 text-sm text-[#7F1D1D]">
              If the problem persists, please refresh the page.
            </p>
            <button
              onClick={this.handleRetry}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#FAD4D8] px-4 py-2 font-semibold text-[#3D3D3D] transition-colors duration-200 hover:bg-[#F5C0C6]"
              aria-label="Retry loading content"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
