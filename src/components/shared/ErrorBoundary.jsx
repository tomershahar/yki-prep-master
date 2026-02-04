import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

/**
 * Enhanced Error Boundary Component
 * Catches React errors and displays user-friendly fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Log to analytics if available
    if (window.analytics?.track) {
      window.analytics.track('error_boundary_triggered', {
        error: error.toString(),
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI from props
      if (this.props.fallback) {
        return this.props.fallback({ 
          error: this.state.error, 
          resetError: this.handleReset 
        });
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50" role="alert" aria-live="assertive">
          <Card className="max-w-lg w-full border-red-200 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {this.props.title || 'Something went wrong'}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                {this.props.description || 'An unexpected error occurred. Please try refreshing the page or return to the home page.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
                  <summary className="cursor-pointer font-medium text-red-800 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <pre className="text-xs text-red-700 overflow-auto max-h-48 whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleReset} 
                  className="flex-1"
                  aria-label="Try again"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleGoHome} 
                  variant="outline"
                  className="flex-1"
                  aria-label="Go to home page"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper
 * Usage: <ErrorBoundaryWrapper>{children}</ErrorBoundaryWrapper>
 */
export function ErrorBoundaryWrapper({ children, fallbackTitle, fallbackDescription }) {
  return (
    <ErrorBoundary title={fallbackTitle} description={fallbackDescription}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;