import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6" dir="rtl">
          <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl border border-rose-100 p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">حدث خطأ غير متوقع في النظام</h1>
            <h2 className="text-lg font-semibold text-slate-700 mb-4" dir="ltr">System Runtime Exception Encountered</h2>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              عذراً، حدث خطأ غير متوقع أثناء معالجة الواجهة أو البيانات. تم منع توقف النظام بالكامل وحماية بياناتك. يرجى إعادة المحاولة أو تحديث الصفحة.
            </p>
            {this.state.error && (
              <div className="bg-slate-900 text-rose-300 p-4 rounded-xl text-left text-xs font-mono mb-6 overflow-auto max-h-40" dir="ltr">
                <strong>{this.state.error.name}:</strong> {this.state.error.message}
                {this.state.errorInfo && this.state.errorInfo.componentStack && (
                  <pre className="mt-2 text-slate-400 text-[10px]">{this.state.errorInfo.componentStack}</pre>
                )}
              </div>
            )}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة المحاولة / Retry</span>
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200"
              >
                تحديث التطبيق / Refresh App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
