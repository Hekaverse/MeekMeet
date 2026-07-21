import { Component, type ReactNode } from 'react'
import { RefreshCcw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In production you would send this to a logging service
    // eslint-disable-next-line no-console
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('ErrorBoundary caught:', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-terracotta-pale flex items-center justify-center mb-4">
            <RefreshCcw className="w-7 h-7 text-terracotta" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif text-xl text-midnight mb-2">Something went wrong</h1>
          <p className="text-sm text-charcoal-muted mb-6 max-w-xs">
            We're sorry — an unexpected error occurred. Tap below to restart the app.
          </p>
          <button
            onClick={this.handleReset}
            className="px-6 py-3 bg-midnight text-cream rounded-xl text-sm font-medium active:scale-95 transition-transform"
          >
            Restart App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
