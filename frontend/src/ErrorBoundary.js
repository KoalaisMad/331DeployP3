import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You can log to an external service here
    console.error('ErrorBoundary caught error', error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:20}}>
          <h3>Something went wrong in this view.</h3>
          <pre style={{whiteSpace:'pre-wrap',color:'#900'}}>{String(this.state.error)}</pre>
          <div style={{marginTop:12}}>
            <button onClick={this.reset} className="btn">Try again</button>
            <button onClick={() => window.location.reload()} className="btn btn-secondary" style={{marginLeft:8}}>Reload page</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
