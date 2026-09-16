import React from 'react'
import ReactDOM from 'react-dom/client'
import AppContent from './App'
import './index.css'

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
    <AppContent />
  </React.StrictMode>
)