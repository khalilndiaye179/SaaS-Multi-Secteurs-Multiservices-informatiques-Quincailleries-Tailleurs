import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', backgroundColor: '#fee2e2', borderRadius: '8px', margin: '1rem' }}>
          <h2>Erreur d'affichage (Composant planté)</h2>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => this.setState({ hasError: false })}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'red', color: 'white', borderRadius: '4px' }}
          >
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
