import { Routes, Route } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AdminLogin from './AdminLogin';
import AdminLayout from '../components/AdminLayout';
import AdminPanel from './AdminPanel';
import AdminGiveaways from './AdminGiveaways';
import '../styles/admin.css';

export default function AdminGate() {
  const { loading, authenticated, configured, authSource, login, setup } =
    useAuth();

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
    return <AdminLogin authSource={authSource} onLogin={login} />;
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminPanel />} />
        <Route path="giveaways" element={<AdminGiveaways />} />
      </Route>
    </Routes>
  );
}
