import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Default to dark theme
;(function () {
  const t = localStorage.getItem('theme')
  if (t !== 'light') {
    document.documentElement.classList.add('dark')
    if (!t) localStorage.setItem('theme', 'dark')
  }
})()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
