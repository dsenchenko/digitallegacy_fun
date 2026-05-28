import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  effectiveNow,
  useActiveDebuffs,
  useCountdown,
  useTimerExpired,
} from '../hooks/useActiveDebuffs';
import { useGiveaways } from '../hooks/useGiveaways';
import { playTimerExpiredSound } from '../utils/timerSound';
import '../styles/widget.css';

function WidgetMenuBanner() {
  return (
    <p className="widget-menu-banner">
      Працює інтерактивне меню донатів. Посилання в чаті по команді{' '}
      <span className="widget-menu-banner__cmd">!menu</span>
    </p>
  );
}

const CATEGORY_VARIANT = {
  'game-debuffs': 'debuff',
  music: 'music',
  interaction: 'interaction',
  'major-requests': 'major',
};

function formatDebuffPrice(item) {
  if (item.price == null || item.price === '') {
    return null;
  }
  return `${item.price} ${item.currency || 'грн'}`;
}

function DebuffOverlay({ item, paused, pausedAt }) {
  const remaining = useCountdown(item.expiresAt, undefined, { paused, pausedAt });
  const now = effectiveNow(paused, pausedAt);
  const variant = item.isRandomResult
    ? 'random'
    : item.categoryId.startsWith('cat-')
      ? 'custom'
      : (CATEGORY_VARIANT[item.categoryId] ?? 'debuff');

  const progress =
    item.expiresAt && item.startedAt
      ? Math.max(
          0,
          Math.min(
            100,
            ((item.expiresAt - now) / (item.expiresAt - item.startedAt)) * 100
          )
        )
      : 100;

  const price = formatDebuffPrice(item);

  return (
    <article className={`debuff-overlay debuff-overlay--${variant}`}>
      <div className="debuff-overlay__head">
        <p className="debuff-overlay__label">{item.categoryName}</p>
        {price && <p className="debuff-overlay__price">{price}</p>}
      </div>
      <h2 className="debuff-overlay__name">{item.name}</h2>
      {item.donorName && (
        <p className="debuff-overlay__donor">Донатер: {item.donorName}</p>
      )}
      {item.hasTimer && item.expiresAt && (
        <div className="debuff-overlay__timer">
          <span className="debuff-overlay__timer-value">{remaining}</span>
          <div className="debuff-overlay__timer-bar">
            <div
              className="debuff-overlay__timer-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </article>
  );
}

function GiveawayWinnerOverlay({ giveaway }) {
  return (
    <article className="giveaway-winner-overlay">
      {giveaway.imageUrl && (
        <img
          className="giveaway-winner-overlay__image"
          src={giveaway.imageUrl}
          alt=""
        />
      )}
      <p className="giveaway-winner-overlay__label">Розіграш</p>
      <h2 className="giveaway-winner-overlay__title">{giveaway.title}</h2>
      <p className="giveaway-winner-overlay__winner">
        🏆 {giveaway.winner.name}
      </p>
    </article>
  );
}

export default function ObsWidget() {
  const { token } = useParams();
  const { active, paused, pausedAt } = useActiveDebuffs();
  const { giveaways } = useGiveaways();
  const [valid, setValid] = useState(null);

  const widgetWinners = giveaways.filter(
    (g) => g.status === 'drawn' && g.winner && g.showOnWidget
  );

  const onTimerExpired = useCallback(() => {
    playTimerExpiredSound();
  }, []);

  useTimerExpired(onTimerExpired);

  useEffect(() => {
    document.documentElement.classList.add('widget-route');
    return () => document.documentElement.classList.remove('widget-route');
  }, []);

  useEffect(() => {
    if (!token) {
      setValid(false);
      return;
    }
    fetch(`/api/widget/validate/${token}`)
      .then((r) => r.json())
      .then((data) => setValid(data.valid))
      .catch(() => setValid(false));
  }, [token]);

  if (valid === null) {
    return <div className="widget-page widget-empty" />;
  }

  if (!valid) {
    return (
      <div className="widget-page widget-invalid">
        <p>Невірне посилання віджета</p>
      </div>
    );
  }

  return (
    <div className="widget-page">
      <div className="widget-stack">
        <WidgetMenuBanner />
        {widgetWinners.map((giveaway) => (
          <GiveawayWinnerOverlay key={giveaway.id} giveaway={giveaway} />
        ))}
        {active.length > 0 && (
          <section className="widget-debuffs">
            <h2 className="widget-debuffs__title">Активні донати</h2>
            {active.map((item) => (
              <DebuffOverlay
                key={item.id}
                item={item}
                paused={paused}
                pausedAt={pausedAt}
              />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
