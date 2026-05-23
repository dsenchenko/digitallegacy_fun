import { useDonations, formatDonationMeta } from '../hooks/useDonations';
import { DONATION_URL } from '../config';
import { buildDonatelloUrl } from '../utils/donatelloUrl';
import {
  DONATE_BTN_ICON,
  getCategoryAccent,
  getCategoryIcon,
  getDonationIcon,
  MENU_HEADER_ICON,
} from '../utils/menuIcons';
import '../styles/menu.css';

export default function ViewerMenu() {
  const { categories, loading } = useDonations();

  if (loading) {
    return (
      <main className="menu">
        <p className="menu__loading">Завантаження...</p>
      </main>
    );
  }

  return (
    <main className="menu">
      <header className="menu__header">
        <span className="menu__header-icon" aria-hidden="true">
          {MENU_HEADER_ICON}
        </span>
        <h1 className="menu__title">Нагороди за донат</h1>
        <p className="menu__subtitle">
          Натисніть на нагороду — відкриється Donatello з уже вказаною сумою та
          текстом
        </p>
        <a
          className="menu__donate-btn"
          href={DONATION_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="menu__donate-btn-icon" aria-hidden="true">
            {DONATE_BTN_ICON}
          </span>
          Задонатити на Donatello
        </a>
      </header>

      {categories.map((category) => {
        const accent = getCategoryAccent(category.id);
        return (
          <section key={category.id} className="menu__section">
            <h2 className={`menu__section-title menu__section-title--${accent}`}>
              <span className={`menu__section-icon menu__section-icon--${accent}`}>
                {getCategoryIcon(category.id)}
              </span>
              {category.name}
            </h2>
            <ul className="menu__list">
              {category.donations.map((donation) => {
                const duration = formatDonationMeta(donation);
                const isRandom = donation.isRandom;
                const icon = getDonationIcon(donation, category.id);
                const donateUrl = buildDonatelloUrl(donation);

                return (
                  <li key={donation.id}>
                    <a
                      className={`menu__item menu__item--${accent}${isRandom ? ' menu__item--random' : ''}`}
                      href={donateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Задонатити ${donation.price} ${donation.currency}: ${donation.name}`}
                    >
                      <span
                        className={`menu__item-icon menu__item-icon--${accent}`}
                        aria-hidden="true"
                      >
                        {icon}
                      </span>
                      <div className="menu__item-info">
                        <p className="menu__item-name">{donation.name}</p>
                        {donation.description && (
                          <p className="menu__item-meta">{donation.description}</p>
                        )}
                        {duration && !isRandom && (
                          <p className="menu__item-meta">
                            <span className="menu__meta-icon">⏱️</span>
                            {duration}
                          </p>
                        )}
                        {isRandom && (
                          <p className="menu__item-meta">
                            <span className="menu__meta-icon">🎲</span>
                            Тривалість залежить від випадкового дебафа
                          </p>
                        )}
                      </div>
                      <span className={`menu__item-price menu__item-price--${accent}`}>
                        {donation.price} {donation.currency}
                      </span>
                      <span className="menu__item-arrow" aria-hidden="true">
                        →
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <footer className="menu__footer">
        <a
          className="menu__donate-link"
          href={DONATION_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span aria-hidden="true">🔗</span> donatello.to/digitallegacyua
        </a>
      </footer>
    </main>
  );
}
