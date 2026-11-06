import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time errors anywhere in the tree so a crash in one component
 * shows a controlled recovery screen instead of a blank white page.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Uncaught UI error:', error, info.componentStack);
  }

  private reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        role="alert"
        className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-8 text-center"
      >
        <h1 className="text-sm font-semibold text-ink-950">
          Something went wrong rendering this view
        </h1>
        <p className="text-xs leading-relaxed text-ink-700">
          An unexpected client-side error occurred: {error.message}. This is not a data problem; no
          records were affected.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={this.reset}>
            Try again
          </Button>
          <Button variant="primary" size="sm" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      </div>
    );
  }
}
