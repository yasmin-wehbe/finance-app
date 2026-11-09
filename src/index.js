import React from 'react'; // Given these are not local files, is there a security risk?
import ReactDOM from 'react-dom/client'; // Given these are not local files, is there a security risk?
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { CurrencyProvider } from './contexts/CurrencyContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CurrencyProvider>
      <App />
    </CurrencyProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
