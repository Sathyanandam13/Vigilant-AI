import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Minimal reset applied purely via JS to avoid any global CSS file dependency
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.backgroundColor = "#070b14"; // deep blue base
document.body.style.color = "#ffffff";
document.body.style.fontFamily = "system-ui, -apple-system, sans-serif";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
