// frontend/src/components/shared/ErrorBoundary.tsx
import { Component, type ReactNode, type ErrorInfo } from 'react';
import { addToast } from '../../stores/toastStore';

interface Props {
  children: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ZARVIS ErrorBoundary]', error, info.componentStack);

    // Notify via toast
    addToast(`Application error: ${error.message}`, 'error', 7000);

    // Propagate to caller if provided
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <div className="text-center">
            <p className="text-xs text-z-error font-mono mb-2">Application Error</p>
            <p className="text-[10px] text-z-dimmed break-words">{this.state.error?.message}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-3 px-3 py-1 rounded text-[10px] font-mono text-z-primary border border-z-primary/30 hover:bg-z-primary/10 cursor-pointer"
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
