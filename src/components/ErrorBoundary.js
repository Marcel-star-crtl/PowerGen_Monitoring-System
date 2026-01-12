import React from 'react';
import { Alert, Button, Card } from 'antd';
import { ReloadOutlined, BugOutlined } from '@ant-design/icons';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Handle ResizeObserver errors specifically - these are usually not critical
    if (error.message && error.message.includes('ResizeObserver')) {
      console.warn('ResizeObserver error caught and suppressed:', error.message);
      return { hasError: false }; // Don't show error UI for ResizeObserver issues
    }
    
    // Handle other errors normally
    return { 
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Don't show UI for ResizeObserver errors
    if (error.message && error.message.includes('ResizeObserver')) {
      return;
    }

    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Optional: Send error to logging service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card style={{ margin: '20px 0' }}>
          <Alert
            message="Something went wrong"
            description={
              <div>
                <p>An error occurred while rendering this component.</p>
                {this.props.showDetails && this.state.error && (
                  <details style={{ marginTop: 10 }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                      <BugOutlined /> Error Details
                    </summary>
                    <pre style={{ 
                      background: '#f5f5f5', 
                      padding: 10, 
                      marginTop: 10,
                      fontSize: 12,
                      overflow: 'auto',
                      maxHeight: 200
                    }}>
                      {this.state.error.toString()}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
                <div style={{ marginTop: 16 }}>
                  <Button 
                    type="primary" 
                    icon={<ReloadOutlined />}
                    onClick={this.handleRetry}
                  >
                    Try Again
                  </Button>
                  {this.state.retryCount > 0 && (
                    <span style={{ marginLeft: 8, color: '#666' }}>
                      (Retry #{this.state.retryCount})
                    </span>
                  )}
                </div>
              </div>
            }
            type="error"
            showIcon
          />
        </Card>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for functional components
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  return function WithErrorBoundaryComponent(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Hook for error handling in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error) => {
    // Don't capture ResizeObserver errors
    if (error.message && error.message.includes('ResizeObserver')) {
      console.warn('ResizeObserver error suppressed:', error.message);
      return;
    }
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

export default ErrorBoundary;