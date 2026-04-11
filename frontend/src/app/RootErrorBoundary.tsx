import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches synchronous render errors so a blank #root never hides the failure.
 */
export class RootErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[RootErrorBoundary]', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            padding: 24,
            fontFamily: 'system-ui, sans-serif',
            background: '#fafafa',
            color: '#111',
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ marginBottom: 16, color: '#444' }}>
            The app hit an error while rendering. Check the browser console for details.
          </p>
          <pre
            style={{
              padding: 16,
              background: '#fff',
              border: '1px solid #ddd',
              borderRadius: 8,
              overflow: 'auto',
              fontSize: 13,
            }}
          >
            {this.state.error.message}
            {import.meta.env.DEV && this.state.error.stack ? `\n\n${this.state.error.stack}` : ''}
          </pre>
          <button
            type="button"
            style={{ marginTop: 20, padding: '10px 16px', fontSize: 15, cursor: 'pointer' }}
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
