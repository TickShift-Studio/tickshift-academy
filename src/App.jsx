import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'

import Login from './pages/Login'
import StudentDashboard from './pages/student/Dashboard'
import MyCourses from './pages/student/Courses'
import CoursePlayer from './pages/student/CoursePlayer'
import Homework from './pages/student/Homework'
import Partners from './pages/student/Partners'
import AdminDashboard from './pages/admin/Dashboard'
import ManageCourses from './pages/admin/Courses'
import ManageAssignments from './pages/admin/Assignments'
import ManageStudents from './pages/admin/Students'

function ProtectedLayout({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#08162E',
      }}>
        <div style={{
          width: 38, height: 38,
          border: '3px solid rgba(15,111,255,0.2)',
          borderTopColor: '#0F6FFF',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/dashboard" replace />

  return (
    <div className="portal-layout">
      <Sidebar />
      <div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
    </div>
  )
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) return null

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to={profile?.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Login />
      } />

      {/* Student routes */}
      <Route path="/dashboard" element={<ProtectedLayout><StudentDashboard /></ProtectedLayout>} />
      <Route path="/courses" element={<ProtectedLayout><MyCourses /></ProtectedLayout>} />
      <Route path="/courses/:courseId" element={<ProtectedLayout><CoursePlayer /></ProtectedLayout>} />
      <Route path="/homework" element={<ProtectedLayout><Homework /></ProtectedLayout>} />
      <Route path="/partners" element={<ProtectedLayout><Partners /></ProtectedLayout>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedLayout adminOnly><AdminDashboard /></ProtectedLayout>} />
      <Route path="/admin/courses" element={<ProtectedLayout adminOnly><ManageCourses /></ProtectedLayout>} />
      <Route path="/admin/assignments" element={<ProtectedLayout adminOnly><ManageAssignments /></ProtectedLayout>} />
      <Route path="/admin/students" element={<ProtectedLayout adminOnly><ManageStudents /></ProtectedLayout>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
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
