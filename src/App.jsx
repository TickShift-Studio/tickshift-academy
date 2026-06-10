import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import AnimatedBg from './components/AnimatedBg'

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
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 24,
    }}>
      <AnimatedBg />
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 18,
          letterSpacing: '0.22em',
          background: 'linear-gradient(135deg, var(--violet), var(--violet-2))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>TICKSHIFT</div>
        <div style={{
          width: 36,
          height: 36,
          border: '2px solid rgba(139,92,246,0.15)',
          borderTopColor: 'var(--violet)',
          borderRadius: '50%',
          animation: 'spin 0.85s linear infinite',
        }} />
      </div>
    </div>
  )
}

function ProtectedLayout({ children, adminOnly = false }) {
  const { user, isAdmin, loading, membershipChecked } = useAuth()
  if (loading || (user && !membershipChecked)) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', position: 'relative' }}>
      <AnimatedBg />
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Navbar />
        <main style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
          {children}
        </main>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user, profile, loading, membershipChecked } = useAuth()
  if (loading || (user && !membershipChecked)) return <Spinner />

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

      <Route path="/hub"       element={<Hub />} />
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
