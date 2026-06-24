import { Component } from "react";

// ErrorBoundary — catches crashes in any child component and shows a safe fallback
// instead of letting the entire app go white.
class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    // Flip hasError flag so the fallback UI renders
    return { hasError: true };
  }

  componentDidCatch(err, info) {
    // Log to console in dev; in production you would send this to a logging service
    console.error("[ErrorBoundary]", err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <span className="material-symbols-outlined error-fallback-icon">
            error
          </span>
          <p>Something went wrong. Please refresh the page.</p>
          <button
            className="error-fallback-btn"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
