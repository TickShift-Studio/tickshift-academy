import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/student/Dashboard'
import Courses from './pages/student/Courses'
import CoursePlayer from './pages/student/CoursePlayer'
import Homework from './pages/student/Homework'
import Partners from './pages/student/Partners'
import AdminDashboard from './pages/admin/Dashboard'
import AdminCourses from './pages/admin/Courses'
import AdminAssignments from './pages/admin/Assignments'
import AdminStudents from './pages/admin/Students'
import Sidebar from './components/Sidebar'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0 }}>{children}</main>
    </div>
  )
}

function AppRoutes() {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return null

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/dashboard" element={<PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>} />
      <Route path="/courses" element={<PrivateRoute><AppLayout><Courses /></AppLayout></PrivateRoute>} />
      <Route path="/courses/:courseId" element={<PrivateRoute><AppLayout><CoursePlayer /></AppLayout></PrivateRoute>} />
      <Route path="/homework" element={<PrivateRoute><AppLayout><Homework /></AppLayout></PrivateRoute>} />
      <Route path="/partners" element={<PrivateRoute><AppLayout><Partners /></AppLayout></PrivateRoute>} />

      <Route path="/admin" element={<PrivateRoute><AppLayout><AdminDashboard /></AppLayout></PrivateRoute>} />
      <Route path="/admin/courses" element={<PrivateRoute><AppLayout><AdminCourses /></AppLayout></PrivateRoute>} />
      <Route path="/admin/assignments" element={<PrivateRoute><AppLayout><AdminAssignments /></AppLayout></PrivateRoute>} />
      <Route path="/admin/students" element={<PrivateRoute><AppLayout><AdminStudents /></AppLayout></PrivateRoute>} />

      <Route path="/" element={<Navigate to={user ? (isAdmin ? '/admin' : '/dashboard') : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
