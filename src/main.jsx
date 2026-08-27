import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import AccessGate from './components/AccessGate.jsx';
import './styles.css';
import './admin/admin.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AccessGate>
      <App />
    </AccessGate>
  </StrictMode>
);
