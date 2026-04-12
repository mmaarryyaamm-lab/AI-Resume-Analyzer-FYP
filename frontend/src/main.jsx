import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Builder from './pages/Builder.jsx'
import Faq from './pages/Faq.jsx'
import Preview from './pages/Preview.jsx'
import Privacy from './pages/Privacy.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'builder', element: <Builder /> },
      { path: 'faq', element: <Faq /> },
      { path: 'privacy', element: <Privacy /> },
      { path: 'preview', element: <Preview /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
