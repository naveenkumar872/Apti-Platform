import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Theme bootstrap — auto-follow system preference on first load, then
// respect the user's explicit choice once they toggle.
;(function () {
  const stored = localStorage.getItem('theme')
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = stored ? stored === 'dark' : prefersDark
  if (isDark) document.documentElement.classList.add('dark')
})()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
