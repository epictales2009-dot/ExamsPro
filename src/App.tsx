import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import LandingPage from './LandingPage';
import Sidebar from './Sidebar';
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import AIExamGenerator from './AIExamGenerator';
import ExamSession from './ExamSession';
import StudentAnalytics from './StudentAnalytics';
import StudentRoster from './StudentRoster';
import ProfilePage from './ProfilePage';
import { Toaster } from 'sonner';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
    </div>
  );
  
  if (!user) return <Navigate to="/" />;
  
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

const DashboardRouter = () => {
  const { isTeacher } = useAuth();
  return isTeacher ? <TeacherDashboard /> : <StudentDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai-generator" 
            element={
              <ProtectedRoute>
                <AIExamGenerator />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/exam/:examId" 
            element={
              <ProtectedRoute>
                <ExamSession />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <StudentAnalytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/roster" 
            element={
              <ProtectedRoute>
                <StudentRoster />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
          {/* Add more routes as needed */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
