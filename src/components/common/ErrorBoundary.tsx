"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { GlassButton } from "../glass/GlassButton";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[JewelleryOS Error Boundary caught exception]:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] w-full p-6 flex items-center justify-center">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-[var(--surface-primary)] border border-red-500/30 backdrop-blur-xl shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {this.props.fallbackTitle || "Something went wrong in this module"}
              </h3>
              <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
                JewelleryOS safeguarded your database session and unsaved transactions. You can retry
                rendering this workspace or reload.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-lg bg-black/50 border border-white/[0.06] text-left text-[11px] text-red-300 font-mono break-all max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <GlassButton
                variant="secondary"
                size="sm"
                icon={<RefreshCw size={13} />}
                onClick={this.handleReset}
              >
                Try Again
              </GlassButton>
              <GlassButton
                variant="primary"
                size="sm"
                icon={<Home size={13} />}
                onClick={this.handleReload}
              >
                Reload Workspace
              </GlassButton>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
