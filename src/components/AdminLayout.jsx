import { Outlet } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import '../styles/matrix.css';

export default function AdminLayout() {
  return (
    <>
      <AdminHeader />
      <main className="admin">
        <Outlet />
      </main>
    </>
  );
}
