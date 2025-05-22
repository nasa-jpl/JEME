// src/index.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Using modern React 18 rendering method
const container = document.getElementById('root');

// Ensure the root element exists
if (!container) {
  console.error('Failed to find the root element. Make sure there is a <div id="root"></div> in your HTML.');
} else {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}