import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'

import Login           from './pages/Login'
import ForgotPassword  from './pages/ForgotPassword'
import ResetPassword   from './pages/ResetPassword'
import StudentDashboard from './pages/student/Dashboard'
import MyCourses       from './pages/student/Courses'
import CoursePlayer    from './pages/student/CoursePlayer'
import Homework        from './pages/student/Homework'
import Partners        from './pages/student/Partners'
import AdminDashboard  from './pages/admin/Dashboard'
import ManageCourses   from './pages/admin/Courses'
import ManageAssignments from './pages/admin/Assignments'
import ManageStudents  from './pages/admin/Students'

function AppLoadingShell() {
  return (
    <div style={{
      minHeight: '100vh', background: '#08162E',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 20,
    }}>
      <div style={{
        fontFamily: "'Montserrat', sans-serif", fontWeight: 900,
        fontSize: 22, letterSpacing: 3, color: '#fff',
      }}>TICKSHIFT</div>
      <div style={{
        width: 36, height: 36,
        border: '3px solid rgba(15,111,255,0.15)',
        borderTopColor: '#0F6FFF',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function ProtectedLayout({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <AppLoadingShell />
  if (!user)   return <Navigate to="/login" replace />
  if (adminOnly && profile !== null && profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#060E1F' }}>
      <Sidebar />
      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>{children}</div>
    </div>
  )
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) return <AppLoadingShell />

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user
            ? <Navigate to={profile?.role === 'admin' ? '/admin' : '/dashboard'} replace />
            : <Login />
        }
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />

      <Route path="/dashboard"         element={<ProtectedLayout><StudentDashboard /></ProtectedLayout>} />
      <Route path="/courses"           element={<ProtectedLayout><MyCourses /></ProtectedLayout>} />
      <Route path="/courses/:courseId" element={<ProtectedLayout><CoursePlayer /></ProtectedLayout>} />
      <Route path="/homework"          element={<ProtectedLayout><Homework /></ProtectedLayout>} />
      <Route path="/partners"          element={<ProtectedLayout><Partners /></ProtectedLayout>} />

      <Route path="/admin"             element={<ProtectedLayout adminOnly><AdminDashboard /></ProtectedLayout>} />
      <Route path="/admin/courses"     element={<ProtectedLayout adminOnly><ManageCourses /></ProtectedLayout>} />
      <Route path="/admin/assignments" element={<ProtectedLayout adminOnly><ManageAssignments /></ProtectedLayout>} />
      <Route path="/admin/students"    element={<ProtectedLayout adminOnly><ManageStudents /></ProtectedLayout>} />

      <Route path="/" element={<Navigate to={user ? (profile?.role === 'admin' ? '/admin' : '/dashboard') : '/login'} replace />} />
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
