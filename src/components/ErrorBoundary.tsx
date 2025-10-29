import React from "react";

type Props = {
  name?: string;
  fallback?: React.ReactNode | ((error: Error) => React.ReactNode);
  children?: React.ReactNode;
};

type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props){
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error){
    return { hasError: true, error } as State;
  }
  componentDidCatch(error: Error, info: any){
    try { console.error(`[DH-UI] ErrorBoundary${this.props.name?`(${this.props.name})`:''}:`, error, info); } catch {}
  }
  render(){
    if (this.state.hasError){
      const { fallback, name } = this.props;
      if (typeof fallback === 'function') return (fallback as any)(this.state.error);
      if (fallback) return <>{fallback}</>;
      const title = name ? `${name} error` : 'Component error';
      return (
        <div className="dh-error-boundary dh-surface" style={{ padding: 8 }}>
          <strong>{title}</strong>
          <div style={{ color: 'var(--dh-text-error)', marginTop: 4, whiteSpace: 'pre-wrap' }}>
            {String(this.state.error?.message || 'An error occurred while rendering.')}
          </div>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}