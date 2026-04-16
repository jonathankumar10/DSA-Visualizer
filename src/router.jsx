import { createBrowserRouter } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import AlgorithmsIndex from './pages/AlgorithmsIndex'
import AlgorithmPage from './pages/AlgorithmPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'algorithms', element: <AlgorithmsIndex /> },
      { path: 'algorithms/:id', element: <AlgorithmPage /> },
      { path: 'system-design', element: <div className="text-slate-400 text-center py-20">System Design coming soon.</div> },
    ],
  },
])
