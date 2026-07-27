import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import RequireRole from './routes/RequireRole';
import Overview from './pages/dashboard/Overview';
import Students from './pages/dashboard/Students';
import Teachers from './pages/dashboard/Teachers';
import Classes from './pages/dashboard/Classes';
import Subjects from './pages/dashboard/Subjects';
import Attendance from './pages/dashboard/Attendance';
import Finance from './pages/dashboard/Finance';
import Exams from './pages/dashboard/Exams';
import ParentPortal from './pages/parent/ParentPortal';
import Reports from './pages/dashboard/Reports';
import Notifications from './pages/dashboard/Notifications';
import Settings from './pages/dashboard/Settings';
import Users from './pages/dashboard/Users';
import './styles/global.css';

function App() {
  return (
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
        <Route path="subjects" element={<Subjects />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="finance" element={<RequireRole allow={['owner']}><Finance /></RequireRole>} />
        <Route path="exams" element={<Exams />} />
        <Route path="reports" element={<RequireRole allow={['owner']}><Reports /></RequireRole>} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<RequireRole allow={['owner']}><Settings /></RequireRole>} />
        <Route path="users" element={<RequireRole allow={['owner']}><Users /></RequireRole>} />
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
  );
}

export default App;