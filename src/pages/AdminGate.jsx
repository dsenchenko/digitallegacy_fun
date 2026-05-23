import { useAuth } from '../hooks/useAuth';
import AdminLogin from './AdminLogin';
import AdminPanel from './AdminPanel';
import '../styles/admin.css';

export default function AdminGate() {
  const { loading, authenticated, configured, login, setup } = useAuth();

  if (loading) {
    return (
      <main className="admin admin--auth">
        <p className="admin-auth__loading">Завантаження...</p>
      </main>
    );
  }

  if (!configured) {
    return <AdminLogin setup onSetup={setup} />;
  }

  if (!authenticated) {
    return <AdminLogin onLogin={login} />;
  }

  return <AdminPanel />;
}
