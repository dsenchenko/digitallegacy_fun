import { useDonations, formatDonationMeta } from '../hooks/useDonations';
import { useActiveDebuffs, useCountdown } from '../hooks/useActiveDebuffs';
import { buildDonatelloUrl } from '../utils/donatelloUrl';
import {
  getCategoryAccent,
  getCategoryIcon,
  getDonationIcon,
} from '../utils/menuIcons';

function MenuActiveItem({ item, paused, pausedAt }) {
  const remaining = useCountdown(item.expiresAt, undefined, { paused, pausedAt });

  return (
    <li className="menu__active-item">
      <div className="menu__active-info">
        <p className="menu__active-name">{item.name}</p>
        {item.categoryName && (
          <p className="menu__active-category">{item.categoryName}</p>
        )}
        {item.isRandomResult && (
          <p className="menu__active-random">🎲 Випадковий дебаф</p>
        )}
        {item.donorName && (
          <p className="menu__active-donor">від {item.donorName}</p>
        )}
      </div>
      {item.hasTimer && item.expiresAt ? (
        <span className="menu__active-timer">{remaining}</span>
      ) : (
        <span className="menu__active-timer menu__active-timer--live">Активно</span>
      )}
    </li>
  );
}

export default function ViewerMenuDonations() {
  const { categories, loading } = useDonations();
  const { active, paused, pausedAt } = useActiveDebuffs();

  if (loading) {
    return <p className="menu__loading">Завантаження...</p>;
  }

  return (
    <>
      {active.length > 0 && (
        <section className="menu__section">
          <h2 className="menu__section-title menu__section-title--red">
            <span className="menu__section-icon menu__section-icon--red">⏱️</span>
            Зараз активні ({active.length})
          </h2>
          <ul className="menu__active-list">
            {active.map((item) => (
              <MenuActiveItem
                key={item.id}
                item={item}
                paused={paused}
                pausedAt={pausedAt}
              />
            ))}
          </ul>
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
                      className={`menu__item menu__item--${accent}`}
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
                        {(duration || isRandom) && (
                          <p className="menu__item-meta">
                            <span className="menu__meta-icon">
                              {isRandom ? '🎲' : '⏱️'}
                            </span>
                            {duration ||
                              'Тривалість залежить від випадкового дебафа'}
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
    </>
  );
}
