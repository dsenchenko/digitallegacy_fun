import { Outlet } from 'react-router-dom';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import '../styles/matrix.css';
import '../styles/social.css';

export default function PublicLayout() {
  return (
    <div className="public">
      <SiteHeader />
      <div className="public__content">
        <div className="public__inner">
          <Outlet />
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
