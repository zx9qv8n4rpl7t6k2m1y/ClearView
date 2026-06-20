import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from 'https://cdn.jsdelivr.net/gh/zx9qv8n4rpl7t6k2m1y/ClearView@main/src/App.tsx';
import 'https://cdn.jsdelivr.net/gh/zx9qv8n4rpl7t6k2m1y/ClearView@main/src/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
