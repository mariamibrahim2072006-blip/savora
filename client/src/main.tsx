import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
import './index.css';
import App from './App';
import { useAuth } from './store/auth';
import { useUi } from './store/ui';

useAuth.getState().hydrate();
const saved = localStorage.getItem('savora_locale') as 'en' | 'ar' | null;
if (saved) useUi.getState().setLocale(saved);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
