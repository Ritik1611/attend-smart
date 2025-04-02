
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ApiService from './services/apiService.ts';

// Set API to use Firebase by default (not mock)
ApiService.setMockApiMode(false);

// Log API configuration
console.log('🔧 API Base URL:', ApiService.getApiBaseUrl());
console.log('🧪 Using Mock API:', ApiService.useMockApi); 

// Get the root element
const rootElement = document.getElementById("root");

// Ensure the root element exists
if (!rootElement) {
  throw new Error("Root element not found");
}

// Create a root and render the app
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
