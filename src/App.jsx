import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import RequireRole from './routes/RequireRole';
import './styles/global.css';

// Bogagga dashboard-ka + Parent Portal waxaa lagu soo dejiyaa kaliya marka la
// booqdo (code-splitting, fiiri react.dev/reference/react/lazy) — waxay ka
// yareeyaan bundle-ka koowaad ee la soo shubo marka bogga hore (LandingPage)
// la furo, maadaama qaar ka mid ah (Reports/Exams/Finance) ay wataan
// maktabado culus sida jsPDF.
const Overview = lazy(() => import('./pages/dashboard/Overview'));
const Students = lazy(() => import('./pages/dashboard/Students'));
const Teachers = lazy(() => import('./pages/dashboard/Teachers'));
const Classes = lazy(() => import('./pages/dashboard/Classes'));
const ClassWorkspace = lazy(() => import('./pages/dashboard/ClassWorkspace'));
const Subjects = lazy(() => import('./pages/dashboard/Subjects'));
const Attendance = lazy(() => import('./pages/dashboard/Attendance'));
const Messages = lazy(() => import('./pages/dashboard/Messages'));
const Finance = lazy(() => import('./pages/dashboard/Finance'));
const Exams = lazy(() => import('./pages/dashboard/Exams'));
const ParentPortal = lazy(() => import('./pages/parent/ParentPortal'));
const Reports = lazy(() => import('./pages/dashboard/Reports'));
const Notifications = lazy(() => import('./pages/dashboard/Notifications'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const Users = lazy(() => import('./pages/dashboard/Users'));
const Trash = lazy(() => import('./pages/dashboard/Trash'));

const PAGE_LOADING_STYLE = {
  height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'Inter, sans-serif', color: '#64748A',
};

function PageFallback() {
  return <div style={PAGE_LOADING_STYLE}>Sugaya...</div>;
}

function App() {
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      {/* Bogga Hore (Marketing/Landing) */}
      <Route path="/" element={<LandingPage />} />

      {/* Dashboard-ka — waa la ilaaliyaa (ProtectedRoute) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="students" element={<Students />} />
        <Route path="teachers" element={<RequireRole allow={['owner']}><Teachers /></RequireRole>} />
        <Route path="classes" element={<Classes />} />
        <Route path="classes/:classId" element={<ClassWorkspace />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="messages" element={<Messages />} />
        <Route path="finance" element={<RequireRole allow={['owner']}><Finance /></RequireRole>} />
        <Route path="exams" element={<Exams />} />
        <Route path="reports" element={<RequireRole allow={['owner']}><Reports /></RequireRole>} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="users" element={<RequireRole allow={['owner']}><Users /></RequireRole>} />
        <Route path="trash" element={<RequireRole allow={['owner']}><Trash /></RequireRole>} />
      </Route>

      {/* Parent Portal — waalidka/ardayga (la ilaaliyaa) */}
      <Route
        path="/parent"
        element={
          <ProtectedRoute>
            <ParentPortal />
          </ProtectedRoute>
        }
      />
    </Routes>
    </Suspense>
  );
}

export default App;