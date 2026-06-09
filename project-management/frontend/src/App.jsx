import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProjectPage from './pages/ProjectPage'

// Protected route — redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
  const { userInfo } = useAuth()
  return userInfo ? children : <Navigate to='/login' />
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/' element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path='/project/:id' element={
          <ProtectedRoute>
            <ProjectPage />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App