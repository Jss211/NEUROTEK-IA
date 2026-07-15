import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Cargar color primario guardado
const savedColor = localStorage.getItem('app-primary-color');
if (savedColor) {
  document.documentElement.style.setProperty('--app-primary', savedColor);
}

// Cargar tema claro/oscuro
const savedTheme = localStorage.getItem('app-theme') || 'Oscuro';
if (savedTheme === 'Oscuro' || savedTheme === 'Sistema') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
