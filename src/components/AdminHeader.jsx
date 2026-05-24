import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useActiveDebuffs } from '../hooks/useActiveDebuffs';

function navLinkClass({ isActive }) {
  return `admin__nav-link${isActive ? ' admin__nav-link--active' : ''}`;
}

export default function AdminHeader() {
  const { logout } = useAuth();
  const { connected } = useActiveDebuffs();

  return (
    <header className="admin__header">
      <nav className="admin__nav" aria-label="Навігація адмін-панелі">
        <NavLink className={navLinkClass} to="/admin" end>
          Донати
        </NavLink>
        <NavLink className={navLinkClass} to="/admin/giveaways">
          Розіграші
        </NavLink>
        <a
          className="admin__nav-link"
          href="/menu"
          target="_blank"
          rel="noreferrer"
        >
          Меню ↗
        </a>
      </nav>

      <div className="admin__header-tools">
        <div className="admin__status">
          <span
            className={`admin__status-dot${connected ? ' admin__status-dot--online' : ''}`}
          />
          {connected ? 'Підключено' : 'Відключено'}
        </div>
        <button
          type="button"
          className="catalog-btn catalog-btn--ghost catalog-btn--small"
          onClick={() => logout()}
        >
          Вийти
        </button>
      </div>
    </header>
  );
}
