import { jsx as _jsx } from "react/jsx-runtime";
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Providers } from './app/providers';
import { router } from './app/router';
import { RootErrorBoundary } from './app/RootErrorBoundary';
import './shared/i18n/i18n';
import './shared/styles/global.css';
const rootElement = document.getElementById('root');
if (!rootElement)
    throw new Error('Root element not found');
try {
    createRoot(rootElement).render(_jsx(RootErrorBoundary, { children: _jsx(Providers, { children: _jsx(RouterProvider, { router: router }) }) }));
}
catch (err) {
    console.error('[bootstrap] createRoot/render failed', err);
    rootElement.textContent = '';
    const msg = document.createElement('div');
    msg.style.cssText =
        'min-height:100vh;padding:24px;font-family:system-ui,sans-serif;background:#fafafa;color:#111';
    msg.innerHTML = `<h1 style="font-size:20px">Failed to start app</h1><pre style="white-space:pre-wrap;font-size:13px">${err instanceof Error ? err.message + (import.meta.env.DEV && err.stack ? '\n\n' + err.stack : '') : String(err)}</pre><p style="margin-top:16px">Open the console for details.</p>`;
    rootElement.appendChild(msg);
}
