// src/components/ErrorBoundary.js
// Error boundary component for handling errors

import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 m-4">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="mb-2">There was an error rendering this component.</p>
          
          {this.props.showDetails && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">View error details</summary>
              <div className="mt-2 p-2 bg-white rounded overflow-auto text-xs">
                <p className="font-mono">{this.state.error && this.state.error.toString()}</p>
                <pre className="mt-2 text-gray-700">
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </div>
            </details>
          )}
          
          {this.props.resetCallback && (
            <button 
              onClick={this.props.resetCallback}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Reset
            </button>
          )}
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;