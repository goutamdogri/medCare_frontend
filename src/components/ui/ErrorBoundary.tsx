import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Last-resort guard: a crashed widget tree shows recovery UI, never white. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-dvh place-items-center bg-app p-6">
          <div className="w-full max-w-md rounded-2xl border border-line bg-card p-8 text-center shadow-card">
            <p className="text-lg font-extrabold text-ink">Something broke</p>
            <p className="mt-2 text-sm leading-relaxed text-sub">
              {this.state.error.message ||
                "An unexpected client-side error occurred."}
            </p>
            <Button
              className="mt-6"
              onClick={() => window.location.reload()}
            >
              Reload control tower
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
