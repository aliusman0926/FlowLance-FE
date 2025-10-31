import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <-- Import this
import App from './App';
// Remove any old CSS imports if they conflict

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter> {/* <-- Wrap App */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);