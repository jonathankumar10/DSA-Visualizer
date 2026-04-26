import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import AlgorithmsIndex from './pages/AlgorithmsIndex'
import AlgorithmPage from './pages/AlgorithmPage'
import SystemDesignIndex from './pages/SystemDesignIndex'
import SystemDesignPage from './pages/SystemDesignPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'algorithms', element: <AlgorithmsIndex /> },
      { path: 'algorithms/:id', element: <AlgorithmPage /> },
      { path: 'system-design', element: <SystemDesignIndex /> },
      { path: 'system-design/:id', element: <SystemDesignPage /> },
    ],
  },
])
