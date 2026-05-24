import { useDonations, formatDonationMeta } from '../hooks/useDonations';
import { useGiveaways, giveawayStatusLabel } from '../hooks/useGiveaways';
import { DONATION_URL } from '../config';
import { buildDonatelloUrl, buildGiveawayDonateUrl } from '../utils/donatelloUrl';
import {
  DONATE_BTN_ICON,
  getCategoryAccent,
  getCategoryIcon,
  getDonationIcon,
  MENU_HEADER_ICON,
} from '../utils/menuIcons';
import '../styles/menu.css';
import '../styles/giveaways.css';

export default function ViewerMenu() {
  const { categories, loading } = useDonations();
  const { giveaways, loading: giveawaysLoading } = useGiveaways();

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

      {!giveawaysLoading && giveaways.length > 0 && (
        <section className="menu__section">
          <h2 className="menu__section-title menu__section-title--purple">
            <span className="menu__section-icon menu__section-icon--purple">🎁</span>
            Розіграші
          </h2>
          <div className="menu__giveaway-grid">
            {giveaways.map((giveaway) => {
              const isOpen = giveaway.status === 'open';
              const donateUrl = buildGiveawayDonateUrl(giveaway);
              return (
                <article
                  key={giveaway.id}
                  className={`menu__giveaway-card${
                    giveaway.status === 'drawn' ? ' menu__giveaway-card--drawn' : ''
                  }`}
                >
                  {giveaway.imageUrl ? (
                    <img
                      className="menu__giveaway-image"
                      src={giveaway.imageUrl}
                      alt={giveaway.title}
                    />
                  ) : (
                    <div className="menu__giveaway-image menu__giveaway-image--placeholder">
                      🎁
                    </div>
                  )}
                  <div className="menu__giveaway-body">
                    <h3 className="menu__giveaway-title">{giveaway.title}</h3>
                    {giveaway.description && (
                      <p className="menu__giveaway-description">
                        {giveaway.description}
                      </p>
                    )}
                    <p className="menu__giveaway-meta">
                      Квиток: {giveaway.ticketPriceUah} UAH ·{' '}
                      {giveawayStatusLabel(giveaway.status)} ·{' '}
                      {giveaway.participantCount} учасників · {giveaway.totalTickets}{' '}
                      квитків
                    </p>
                    {giveaway.winner && (
                      <p className="menu__giveaway-winner">
                        🏆 Переможець: {giveaway.winner.name}
                      </p>
                    )}
                    <a
                      className={`menu__giveaway-btn${
                        isOpen ? '' : ' menu__giveaway-btn--disabled'
                      }`}
                      href={isOpen ? donateUrl : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-disabled={!isOpen}
                    >
                      {isOpen ? 'Взяти участь' : 'Розіграш завершено'}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

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
