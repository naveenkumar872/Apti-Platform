import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './stores/authStore';
import ErrorBoundary from './components/ErrorBoundary';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOTP from './pages/auth/VerifyOTP';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Student pages
import StudentLayout from './components/Layout/StudentLayout';
import StudentDashboard from './pages/student/Dashboard';
import StudyMaterials from './pages/student/StudyMaterials';
import Practice from './pages/student/Practice';
import Tests from './pages/student/Tests';
import Reports from './pages/student/Reports';
import StudyPlan from './pages/student/StudyPlan';
import CompanyCorner from './pages/student/CompanyCorner';
import Leaderboard from './pages/student/Leaderboard';
import Doubts from './pages/student/Doubts';

// Admin pages
import AdminLayout from './components/Layout/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import TestBuilder from './pages/admin/TestBuilder';
import QuestionBank from './pages/admin/QuestionBank';
import Materials from './pages/admin/Materials';
import Users from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuthStore();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/login" replace />;
  return <Outlet />;
};

function App() {
  const init = useAuthStore((s) => s.init);
  useEffect(() => { init(); }, [init]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route element={<StudentLayout />}>
            <Route path="/student/dashboard" element={<ErrorBoundary><StudentDashboard /></ErrorBoundary>} />
            <Route path="/student/materials" element={<ErrorBoundary><StudyMaterials /></ErrorBoundary>} />
            <Route path="/student/practice" element={<ErrorBoundary><Practice /></ErrorBoundary>} />
            <Route path="/student/tests" element={<ErrorBoundary><Tests /></ErrorBoundary>} />
            <Route path="/student/reports" element={<ErrorBoundary><Reports /></ErrorBoundary>} />
            <Route path="/student/plan" element={<ErrorBoundary><StudyPlan /></ErrorBoundary>} />
            <Route path="/student/companies" element={<ErrorBoundary><CompanyCorner /></ErrorBoundary>} />
            <Route path="/student/leaderboard" element={<ErrorBoundary><Leaderboard /></ErrorBoundary>} />
            <Route path="/student/doubts" element={<ErrorBoundary><Doubts /></ErrorBoundary>} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher']} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<ErrorBoundary><AdminDashboard /></ErrorBoundary>} />
            <Route path="/admin/tests" element={<ErrorBoundary><TestBuilder /></ErrorBoundary>} />
            <Route path="/admin/questions" element={<ErrorBoundary><QuestionBank /></ErrorBoundary>} />
            <Route path="/admin/materials" element={<ErrorBoundary><Materials /></ErrorBoundary>} />
            <Route path="/admin/users" element={<ErrorBoundary><Users /></ErrorBoundary>} />
            <Route path="/admin/reports" element={<ErrorBoundary><AdminReports /></ErrorBoundary>} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
