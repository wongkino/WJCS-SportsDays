import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import AppleThemeProvider from './AppleThemeProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppleThemeProvider>
      <App />
    </AppleThemeProvider>
  </React.StrictMode>
);
