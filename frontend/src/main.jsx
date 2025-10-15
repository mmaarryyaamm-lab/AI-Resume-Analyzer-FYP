import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import Templates from './pages/Templates.jsx'
import Builder from './pages/Builder.jsx'
import Pricing from './pages/Pricing.jsx'
import Faq from './pages/Faq.jsx'
import Preview from './pages/Preview.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'templates', element: <Templates /> },
      { path: 'builder', element: <Builder /> },
      
      { path: 'faq', element: <Faq /> },
      { path: 'preview', element: <Preview /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
