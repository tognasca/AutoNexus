import React from 'react'
import ReactDOM from 'react-dom/client'
import AppContent from './App'
import './index.css'

class AppErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Falha ao renderizar o AT MOTORS:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main role="alert" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, background: '#06111f', color: '#fff', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <strong style={{ fontSize: 32, fontWeight: 900, letterSpacing: '.08em' }}>AT MOTORS</strong>
          <h1 style={{ margin: 0, fontSize: 20 }}>Não foi possível abrir esta página</h1>
          <p style={{ maxWidth: 420, color: '#cbd5e1' }}>Tente carregar novamente. Se o problema continuar, abra o site no Safari ou Chrome.</p>
          <button onClick={() => window.location.reload()} style={{ border: 0, borderRadius: 10, padding: '12px 20px', background: '#2563eb', color: '#fff', fontWeight: 700 }}>
            Tentar novamente
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

// Autolimpeza de Service Workers antigos em ambiente de desenvolvimento
if ('serviceWorker' in navigator && import.meta.env.DEV) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AppContent />
    </AppErrorBoundary>
  </React.StrictMode>
)