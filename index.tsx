import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMsg: string;
}

class SovereignRootErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, errorMsg: '' };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      errorMsg: error instanceof Error ? error.message : String(error)
    };
  }

  componentDidCatch(error: unknown) {
    console.warn('Sovereign Root Error Boundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col items-center justify-center p-6 text-center gap-4"
        >
          <div className="max-w-md p-6 rounded-2xl bg-zinc-900/90 border border-emerald-500/40 space-y-3 shadow-2xl">
            <h2 className="text-base font-bold text-emerald-300">استعادة الجلسة التلقائية — نيكسوس 3.1</h2>
            <p className="text-xs text-zinc-300 leading-relaxed">
              حدث تنبيه عابر أثناء عرض أحد المكونات وتم حفظ جميع بياناتك وجلساتك بأمان.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, errorMsg: '' })}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
            >
              متابعة العمل فوراً
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <SovereignRootErrorBoundary>
      <App />
    </SovereignRootErrorBoundary>
  </React.StrictMode>
);