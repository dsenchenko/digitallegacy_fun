import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useActiveDebuffs } from '../hooks/useActiveDebuffs';

function navClass({ isActive }) {
  return `site-header__link${isActive ? ' site-header__link--active' : ''}`;
}

export default function AdminHeader() {
  const { logout } = useAuth();
  const { connected } = useActiveDebuffs();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/admin" className="site-header__brand" aria-label="Адмін-панель">
          <img
            className="site-header__logo"
            src="/logo.png"
            alt="Digital Legacy"
            decoding="async"
          />
        </Link>

        <nav className="site-header__nav" aria-label="Навігація адмін-панелі">
          <NavLink to="/admin" end className={navClass}>
            Донати
          </NavLink>
          <NavLink to="/admin/giveaways" className={navClass}>
            Розіграші
          </NavLink>
          <a
            className="site-header__link"
            href="/menu"
            target="_blank"
            rel="noreferrer"
          >
            Меню ↗
          </a>
          <div className="admin__status">
            <span
              className={`admin__status-dot${connected ? ' admin__status-dot--online' : ''}`}
            />
            {connected ? 'Підключено' : 'Відключено'}
          </div>
          <button
            type="button"
            className="site-header__link admin__logout"
            onClick={() => logout()}
          >
            Вийти
          </button>
        </nav>
      </div>
    </header>
  );
}
