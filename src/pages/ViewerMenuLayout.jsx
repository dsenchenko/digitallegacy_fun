import { Outlet, useLocation } from 'react-router-dom';
import '../styles/menu.css';

const PAGE_META = {
  '/menu': {
    title: 'Нагороди за донат',
    subtitle:
      'Натисніть на нагороду — відкриється Donatello з уже вказаною сумою та текстом',
  },
  '/giveaways': {
    title: 'Розіграші',
    subtitle: 'Беріть участь у розіграшах — кожен квиток це окремий донат на Donatello',
  },
};

export default function ViewerMenuLayout() {
  const { pathname } = useLocation();
  const meta = PAGE_META[pathname] ?? PAGE_META['/menu'];

  return (
    <main className="menu">
      <header className="menu__header">
        <h1 className="menu__title">{meta.title}</h1>
        <p className="menu__subtitle">{meta.subtitle}</p>
      </header>

      <Outlet />
    </main>
  );
}
