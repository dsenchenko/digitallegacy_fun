import SocialLinks from './SocialLinks';

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <nav className="site-footer__nav" aria-label="Посилання внизу сторінки">
          <SocialLinks size="sm" className="site-footer__social" />
        </nav>
      </div>
    </footer>
  );
}
