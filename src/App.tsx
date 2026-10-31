import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import { StudentLayout } from './components/layout/StudentLayout';
import { FacultyLayout } from './components/layout/FacultyLayout';
import { StaffLayout } from './components/layout/StaffLayout';

// Common Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Student Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentAttendancePage } from './pages/student/StudentAttendancePage';
import { StudentFeesPage } from './pages/student/StudentFeesPage';
import { StudentLibraryPage } from './pages/student/StudentLibraryPage';
import { StudentExamPage } from './pages/student/StudentExamPage';
import { StudentResultPage } from './pages/student/StudentResultPage';
import { StudentPlacementPage } from './pages/student/StudentPlacementPage';

// Faculty Pages
import { FacultyDashboardPage } from './pages/faculty/FacultyDashboardPage';
import { FacultyAttendancePage } from './pages/faculty/FacultyAttendancePage';
import { FacultyGradingPage } from './pages/faculty/FacultyGradingPage';
import { FacultyLeavePage } from './pages/faculty/FacultyLeavePage';
import { FacultyPayrollPage } from './pages/faculty/FacultyPayrollPage';

// Staff Pages
import { StaffDashboardPage } from './pages/staff/StaffDashboardPage';
import { TNPCompaniesPage } from './pages/staff/TNPCompaniesPage';
import { TNPPlacementsPage } from './pages/staff/TNPPlacementsPage';
import { FinanceFeesPage } from './pages/staff/FinanceFeesPage';
import { LibrarianBooksPage } from './pages/staff/LibrarianBooksPage';
import { LibrarianIssuancePage } from './pages/staff/LibrarianIssuancePage';

// Smart Root Redirect based on active session
const RootRedirect: React.FC = () => {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role === 'TNP_HEAD' || role === 'FINANCE' || role === 'LIBRARIAN') {
    return <Navigate to="/staff/dashboard" replace />;
  }
  if (role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Dedicated Student Portal Routes */}
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboardPage />} />
            <Route path="attendance" element={<StudentAttendancePage />} />
            <Route path="fees" element={<StudentFeesPage />} />
            <Route path="library" element={<StudentLibraryPage />} />
            <Route path="examination" element={<StudentExamPage />} />
            <Route path="results" element={<StudentResultPage />} />
            <Route path="placement" element={<StudentPlacementPage />} />
          </Route>

          {/* Dedicated Faculty Portal Routes */}
          <Route path="/faculty" element={<FacultyLayout />}>
            <Route index element={<Navigate to="/faculty/dashboard" replace />} />
            <Route path="dashboard" element={<FacultyDashboardPage />} />
            <Route path="attendance" element={<FacultyAttendancePage />} />
            <Route path="grading" element={<FacultyGradingPage />} />
            <Route path="leave" element={<FacultyLeavePage />} />
            <Route path="payroll" element={<FacultyPayrollPage />} />
          </Route>

          {/* Dedicated Staff Portal Routes */}
          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="dashboard" element={<StaffDashboardPage />} />

            {/* TNP Cell Routes */}
            <Route path="companies" element={<TNPCompaniesPage />} />
            <Route path="drives" element={<TNPPlacementsPage initialTab="drives" />} />
            <Route path="applications" element={<TNPPlacementsPage initialTab="applications" />} />
            <Route path="placements" element={<TNPPlacementsPage initialTab="placements" />} />

            {/* Finance Officer Routes */}
            <Route path="fees" element={<FinanceFeesPage initialTab="fees" />} />
            <Route path="payments" element={<FinanceFeesPage initialTab="payments" />} />
            <Route path="fee-structures" element={<FinanceFeesPage initialTab="structures" />} />
            <Route path="reports" element={<FinanceFeesPage initialTab="reports" />} />

            {/* Librarian Routes */}
            <Route path="books" element={<LibrarianBooksPage />} />
            <Route path="issues" element={<LibrarianIssuancePage initialTab="issues" />} />
            <Route path="overdue" element={<LibrarianIssuancePage initialTab="overdue" />} />
            <Route path="returns" element={<LibrarianIssuancePage initialTab="returns" />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
