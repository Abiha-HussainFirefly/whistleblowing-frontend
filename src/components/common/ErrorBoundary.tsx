import { Component, type ErrorInfo, type ReactElement, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** Shown instead of the default panel, e.g. to keep a route's chrome visible. */
  fallback?: (reset: () => void) => ReactElement;
}

interface State {
  hasError: boolean;
}

/**
 * Catches render errors so a single broken component does not blank the page.
 *
 * The displayed message is deliberately free of detail. An error on this product
 * can occur while a case is on screen, and React error messages routinely carry
 * component props — which here could mean allegation text or a reporter's
 * identity. The message the user sees must never become a disclosure channel, so
 * nothing from the error object is rendered.
 *
 * The error is logged to the console for local debugging only. Wiring this to an
 * error-reporting service requires scrubbing first: see `VITE_SENTRY_DSN` in
 * `.env.example`.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
       
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  private reset = (): void => {
    this.setState({ hasError: false });
  };

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback !== undefined) return this.props.fallback(this.reset);

    return (
      <div
        role="alert"
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center"
      >
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          This page could not be displayed. Your report and any information you have already
          submitted are unaffected.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={this.reset}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Go to start
          </button>
        </div>
      </div>
    );
  }
}
