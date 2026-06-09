import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'

import Login            from './pages/Login'
import ForgotPassword   from './pages/ForgotPassword'
import ResetPassword    from './pages/ResetPassword'
import StudentDashboard from './pages/student/Dashboard'
import MyCourses        from './pages/student/Courses'
import CoursePlayer     from './pages/student/CoursePlayer'
import Homework         from './pages/student/Homework'
import Partners         from './pages/student/Partners'
import AdminDashboard   from './pages/admin/Dashboard'
import ManageCourses    from './pages/admin/Courses'
import ManageAssignments from './pages/admin/Assignments'
import ManageStudents   from './pages/admin/Students'
import AdminContent     from './pages/admin/Content'
import Hub              from './pages/hub/Hub'
import Post             from './pages/hub/Post'

function Spinner() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 900, fontSize: 20, letterSpacing: 3, color: 'var(--white)' }}>TICKSHIFT</div>
      <div style={{ width: 32, height: 32, border: '2.5px solid rgba(15,111,255,0.18)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.75s linear infinite' }} />
    </div>
  )
}

function ProtectedLayout({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && profile !== null && profile?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {children}
      </main>
    </div>
  )
}

function AppRoutes() {
  const { user, profile, loading } = useAuth()
  if (loading) return <Spinner />

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to={profile?.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Login />
      } />
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
      <Route path="/admin/content"     element={<ProtectedLayout adminOnly><AdminContent /></ProtectedLayout>} />

      <Route path="/hub"      element={<Hub />} />
      <Route path="/hub/:slug" element={<Post />} />

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
