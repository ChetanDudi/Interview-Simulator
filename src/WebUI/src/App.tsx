import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage          from './pages/LoginPage'
import RegisterPage       from './pages/RegisterPage'
import VerifyEmailPage    from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import VerifyResetOtpPage from './pages/VerifyResetOtpPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'
import HomePage           from './pages/HomePage'
import ResumePage         from './pages/ResumePage'
import InterviewPage      from './pages/InterviewPage'
import VoiceInterviewPage from './pages/VoiceInterviewPage'
import ReportPage         from './pages/ReportPage'
import SessionsPage        from './pages/SessionsPage'
import PracticePage        from './pages/PracticePage'
import PracticeViewPage    from './pages/PracticeViewPage'
import SharedPracticePage        from './pages/SharedPracticePage'
import SharedInterviewPage       from './pages/SharedInterviewPage'
import SharedInterviewAttemptPage from './pages/SharedInterviewAttemptPage'
import ProtectedRoute      from './components/ProtectedRoute'

function RootRedirect() {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="loading-screen"><span className="spinner" /></div>
  return user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                 element={<RootRedirect />} />
        <Route path="/login"            element={<LoginPage />} />
        <Route path="/register"         element={<RegisterPage />} />
        <Route path="/verify-email"     element={<VerifyEmailPage />} />
        <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
        <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
        <Route path="/reset-password"   element={<ResetPasswordPage />} />
        <Route path="/home"             element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/resumes"          element={<ProtectedRoute><ResumePage /></ProtectedRoute>} />
        <Route path="/interview/:id"       element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
        <Route path="/voice-interview/:id" element={<ProtectedRoute><VoiceInterviewPage /></ProtectedRoute>} />
        <Route path="/report/:id"       element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
        <Route path="/sessions"                    element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
        <Route path="/practice"                    element={<ProtectedRoute><PracticePage /></ProtectedRoute>} />
        <Route path="/practice/:id"                element={<ProtectedRoute><PracticeViewPage /></ProtectedRoute>} />
        <Route path="/shared/practice/:token"          element={<SharedPracticePage />} />
        <Route path="/shared/interview/:token/attempt" element={<SharedInterviewAttemptPage />} />
        <Route path="/shared/interview/:token"         element={<SharedInterviewPage />} />
        <Route path="*"                            element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
