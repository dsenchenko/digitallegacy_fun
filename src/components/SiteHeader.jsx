import { Link, NavLink } from 'react-router-dom';
import { DONATION_URL } from '../config';

function navClass({ isActive }) {
  return `site-header__link${isActive ? ' site-header__link--active' : ''}`;
}

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="site-header__brand" aria-label="Digital Legacy — головна">
          <img
            className="site-header__logo"
            src="/logo.png"
            alt="Digital Legacy"
            decoding="async"
          />
        </Link>

        <nav className="site-header__nav" aria-label="Головна навігація">
          <NavLink to="/menu" end className={navClass}>
            Меню
          </NavLink>
          <NavLink to="/giveaways" className={navClass}>
            Розіграші
          </NavLink>
          <a
            className="site-header__donate"
            href={DONATION_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Задонатити
          </a>
        </nav>
      </div>
    </header>
  );
}
