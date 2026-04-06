import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Providers } from './app/providers';
import { router } from './app/router';
import './shared/i18n/i18n';
import './shared/styles/global.css';
const rootElement = document.getElementById('root');
if (!rootElement)
    throw new Error('Root element not found');
createRoot(rootElement).render(_jsx(React.StrictMode, { children: _jsx(Providers, { children: _jsx(RouterProvider, { router: router }) }) }));
