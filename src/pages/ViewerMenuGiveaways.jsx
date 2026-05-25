import { useGiveaways, giveawayStatusLabel } from '../hooks/useGiveaways';
import { buildGiveawayDonateUrl } from '../utils/donatelloUrl';
import '../styles/giveaways.css';

export default function ViewerMenuGiveaways() {
  const { giveaways, loading } = useGiveaways();

  if (loading) {
    return <p className="menu__loading">Завантаження...</p>;
  }

  if (giveaways.length === 0) {
    return (
      <p className="menu__empty">Наразі немає активних розіграшів. Загляньте пізніше!</p>
    );
  }

  return (
    <section className="menu__section">
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
  );
}
