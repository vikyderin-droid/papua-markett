import { Component, type ErrorInfo, type ReactNode } from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PAPUA MARKET error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold text-[#14452F] mb-2">Terjadi kesalahan</h1>
          <p className="text-sm text-[#5C665E] mb-5">
            Halaman gagal ditampilkan. Muat ulang halaman; jika masalah berlanjut, periksa
            Console browser (F12) dan Terminal server.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-[#14452F] text-white text-sm font-semibold cursor-pointer"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    );
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
