import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App'
import Poll from './pages/Poll'
import Results from './pages/Results'

const router = createBrowserRouter([
  { path: '/', element: <App />, children: [
    { index: true, element: <Poll /> },
    { path: 'results', element: <Results /> },
  ]},
])

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)