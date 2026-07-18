import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/admin.css';
import './styles/app-shell.css';
import { App } from './App';

const el = document.getElementById('root');
if (!el) throw new Error('#root missing');

createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
