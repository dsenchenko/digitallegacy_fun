import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  useActiveDebuffs,
  useCountdown,
  useTimerExpired,
} from '../hooks/useActiveDebuffs';
import { playTimerExpiredSound } from '../utils/timerSound';
import '../styles/widget.css';

const CATEGORY_VARIANT = {
  'game-debuffs': 'debuff',
  music: 'music',
  interaction: 'interaction',
  'major-requests': 'major',
};

function DebuffOverlay({ item }) {
  const remaining = useCountdown(item.expiresAt);
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
            ((item.expiresAt - Date.now()) /
              (item.expiresAt - item.startedAt)) *
              100
          )
        )
      : 100;

  return (
    <article className={`debuff-overlay debuff-overlay--${variant}`}>
      <p className="debuff-overlay__label">{item.categoryName}</p>
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

export default function ObsWidget() {
  const { token } = useParams();
  const { active } = useActiveDebuffs();
  const [valid, setValid] = useState(null);

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

  if (active.length === 0) {
    return <div className="widget-page widget-empty" />;
  }

  return (
    <div className="widget-page">
      <div className="widget-stack">
        {active.map((item) => (
          <DebuffOverlay key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
