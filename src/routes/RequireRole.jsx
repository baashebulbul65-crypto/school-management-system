import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner, { useSimulatedProgress } from '../components/Spinner';

function RequireRole({ allow = [], children }) {
  const { profile, loading } = useAuth();
  const { percent, done } = useSimulatedProgress(loading);

  // 1. Sug inta xogtu ka soo load gareynayso
  if (!done) {
    return (
      <div className="spinner-overlay">
        <Spinner percent={percent} size={140} />
      </div>
    );
  }

  // 2. Qaado doorka dhabta ah ee isticmaalaha (e.g. 'owner', 'teacher', 'arday', 'waalid')
  const userRole = profile?.role;

  // 3. Haddii doorkiisu uusan ku jirin kuwa loo oggol yahay, u celi dashboard-ka
  if (!userRole || !allow.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Haddii uu leeyahay fasax, sii daay
  return children;
}

export default RequireRole;