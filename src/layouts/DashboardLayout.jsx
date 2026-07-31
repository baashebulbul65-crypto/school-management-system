import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import Topbar from '../components/dashboard/Topbar';
import './DashboardLayout.css';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard-ka',
  '/dashboard/students': 'Ardayda',
  '/dashboard/teachers': 'Macallimiinta',
  '/dashboard/classes': 'Fasallada',
  '/dashboard/subjects': 'Maadooyinka', // <--- Halkan ku dar!
  '/dashboard/attendance': 'Imaanshaha',
  '/dashboard/messages': 'Fariimaha',
  '/dashboard/finance': 'Lacagta',
  '/dashboard/reports': 'Warbixinno',
  '/dashboard/settings': 'Dejinta',
};

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Dashboard-ka';

  return (
    <div className="dashboard-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-main">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;