import { useState } from 'react';
import {
  createGiveaway,
  giveawayStatusLabel,
  useGiveawayAdmin,
  useGiveaways,
} from '../hooks/useGiveaways';
import '../styles/admin.css';
import '../styles/giveaways.css';

function CreateGiveawayForm({ onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ticketPriceUah, setTicketPriceUah] = useState('50');
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('ticketPriceUah', ticketPriceUah);
      if (image) formData.append('image', image);
      const created = await createGiveaway(formData);
      setTitle('');
      setDescription('');
      setTicketPriceUah('50');
      setImage(null);
      event.target.reset();
      onCreated(created.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin__section giveaway-create">
      <h2 className="admin__section-title">Новий розіграш</h2>
      <form className="catalog-form" onSubmit={handleSubmit}>
        <label className="catalog-form__field">
          Назва
          <input
            className="catalog-form__input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="catalog-form__field">
          Опис
          <textarea
            className="catalog-form__input catalog-form__textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="catalog-form__field">
          Ціна квитка (UAH)
          <input
            className="catalog-form__input"
            type="number"
            min="1"
            step="1"
            value={ticketPriceUah}
            onChange={(e) => setTicketPriceUah(e.target.value)}
            required
          />
        </label>
        <label className="catalog-form__field">
          Фото
          <input
            className="catalog-form__input"
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
          />
        </label>
        {error && <p className="admin__error">{error}</p>}
        <button type="submit" className="catalog-btn" disabled={busy}>
          {busy ? 'Створення...' : 'Створити розіграш'}
        </button>
      </form>
    </section>
  );
}

function AddParticipantForm({ ticketPriceUah, onAdd, busy }) {
  const [name, setName] = useState('');
  const [donatedAmountUah, setDonatedAmountUah] = useState('');
  const tickets =
    donatedAmountUah && ticketPriceUah
      ? Math.floor(Number(donatedAmountUah) / Number(ticketPriceUah))
      : 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onAdd({ name, donatedAmountUah: Number(donatedAmountUah) });
    setName('');
    setDonatedAmountUah('');
  };

  return (
    <form className="giveaway-participant-form" onSubmit={handleSubmit}>
      <label className="catalog-form__field">
        Ім&apos;я учасника
        <input
          className="catalog-form__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <label className="catalog-form__field">
        Сума донату (UAH)
        <input
          className="catalog-form__input"
          type="number"
          min={ticketPriceUah}
          step="1"
          value={donatedAmountUah}
          onChange={(e) => setDonatedAmountUah(e.target.value)}
          required
        />
      </label>
      <p className="giveaway-participant-form__hint">
        Квитків: {tickets > 0 ? tickets : '—'} (1 квиток = {ticketPriceUah} UAH)
      </p>
      <button type="submit" className="catalog-btn catalog-btn--small" disabled={busy}>
        {busy ? '...' : 'Додати учасника'}
      </button>
    </form>
  );
}

function GiveawayDetail({ giveawayId, onClose }) {
  const {
    giveaway,
    loading,
    error,
    addParticipant,
    removeParticipant,
    drawWinner,
    deleteGiveaway,
    setWidgetDisplay,
  } = useGiveawayAdmin(giveawayId);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const run = async (fn) => {
    setBusy(true);
    setActionError('');
    try {
      await fn();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !giveaway) {
    return <p className="giveaway-detail__loading">Завантаження...</p>;
  }

  if (!giveaway) {
    return <p className="admin__error">{error || 'Розіграш не знайдено'}</p>;
  }

  const canDraw = giveaway.status !== 'drawn' && giveaway.participants.length > 0;

  return (
    <section className="giveaway-detail admin__section">
      <div className="giveaway-detail__header">
        {giveaway.imageUrl && (
          <img
            className="giveaway-detail__image"
            src={giveaway.imageUrl}
            alt={giveaway.title}
          />
        )}
        <div>
          <h2 className="giveaway-detail__title">{giveaway.title}</h2>
          <p className="giveaway-detail__meta">
            Квиток: {giveaway.ticketPriceUah} UAH ·{' '}
            {giveawayStatusLabel(giveaway.status)} · Учасників:{' '}
            {giveaway.participantCount} · Квитків: {giveaway.totalTickets}
          </p>
          {giveaway.description && (
            <p className="giveaway-detail__description">{giveaway.description}</p>
          )}
          {giveaway.winner && (
            <p className="giveaway-detail__winner">
              🏆 Переможець: <strong>{giveaway.winner.name}</strong>
            </p>
          )}
          {giveaway.status === 'drawn' && (
            <p className="giveaway-detail__widget-status">
              Віджет OBS:{' '}
              {giveaway.showOnWidget ? 'показується' : 'приховано'}
            </p>
          )}
        </div>
      </div>

      {(error || actionError) && (
        <p className="admin__error">{actionError || error}</p>
      )}

      {giveaway.status === 'drawn' && (
        <div className="giveaway-detail__actions">
          <button
            type="button"
            className="catalog-btn"
            disabled={busy}
            onClick={() =>
              run(() => setWidgetDisplay(!giveaway.showOnWidget))
            }
          >
            {giveaway.showOnWidget
              ? 'Приховати з віджета'
              : 'Показати на віджеті'}
          </button>
          <button
            type="button"
            className="catalog-btn catalog-btn--danger"
            disabled={busy}
            onClick={() => {
              if (
                !window.confirm(
                  `Видалити розіграш «${giveaway.title}»? Цю дію не можна скасувати.`
                )
              ) {
                return;
              }
              run(async () => {
                await deleteGiveaway();
                onClose();
              });
            }}
          >
            Видалити розіграш
          </button>
        </div>
      )}

      {giveaway.status !== 'drawn' && (
        <>
          <AddParticipantForm
            ticketPriceUah={giveaway.ticketPriceUah}
            busy={busy}
            onAdd={(payload) => run(() => addParticipant(payload))}
          />

          <div className="giveaway-detail__actions">
            <button
              type="button"
              className="catalog-btn"
              disabled={!canDraw || busy}
              onClick={() => {
                if (
                  !window.confirm(
                    `Обрати переможця випадково серед ${giveaway.totalTickets} квитків?`
                  )
                ) {
                  return;
                }
                run(() => drawWinner());
              }}
            >
              {busy ? '...' : '🎲 Обрати переможця'}
            </button>
            <button
              type="button"
              className="catalog-btn catalog-btn--danger"
              disabled={busy}
              onClick={() => {
                if (
                  !window.confirm(
                    `Видалити розіграш «${giveaway.title}»? Цю дію не можна скасувати.`
                  )
                ) {
                  return;
                }
                run(async () => {
                  await deleteGiveaway();
                  onClose();
                });
              }}
            >
              Видалити розіграш
            </button>
          </div>
        </>
      )}

      <h3 className="giveaway-detail__subtitle">Учасники</h3>
      {giveaway.participants.length === 0 ? (
        <p className="giveaway-detail__empty">Ще немає учасників</p>
      ) : (
        <ul className="giveaway-participants">
          {giveaway.participants.map((participant) => (
            <li key={participant.id} className="giveaway-participants__item">
              <div>
                <strong>{participant.name}</strong>
                <span>
                  {participant.ticketCount} квитк.
                  {participant.donatedAmountUah
                    ? ` · ${participant.donatedAmountUah} UAH`
                    : ''}
                </span>
              </div>
              {giveaway.status !== 'drawn' && (
                <button
                  type="button"
                  className="active-item__stop"
                  disabled={busy}
                  onClick={() =>
                    run(() => removeParticipant(participant.id))
                  }
                >
                  Видалити
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function AdminGiveaways() {
  const { giveaways, loading } = useGiveaways();
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      <div className="admin__page-header">
        <h1 className="admin__title">Розіграші</h1>
        <p className="admin__subtitle">
          Створюйте розіграші, додавайте учасників вручну після донату, обирайте
          переможця з урахуванням кількості квитків
        </p>
      </div>

      <CreateGiveawayForm onCreated={setSelectedId} />

      <section className="admin__section">
        <h2 className="admin__section-title">Список розіграшів</h2>
        {loading ? (
          <p>Завантаження...</p>
        ) : giveaways.length === 0 ? (
          <p className="giveaway-detail__empty">Ще немає розіграшів</p>
        ) : (
          <ul className="giveaway-list">
            {giveaways.map((giveaway) => (
              <li key={giveaway.id}>
                <button
                  type="button"
                  className={`giveaway-list__item${
                    selectedId === giveaway.id ? ' giveaway-list__item--active' : ''
                  }`}
                  onClick={() =>
                    setSelectedId(selectedId === giveaway.id ? null : giveaway.id)
                  }
                >
                  {giveaway.imageUrl && (
                    <img src={giveaway.imageUrl} alt="" aria-hidden="true" />
                  )}
                  <span>
                    <strong>{giveaway.title}</strong>
                    <small>
                      {giveaway.ticketPriceUah} UAH ·{' '}
                      {giveawayStatusLabel(giveaway.status)} ·{' '}
                      {giveaway.participantCount} учасн. · {giveaway.totalTickets}{' '}
                      квитк.
                      {giveaway.winner ? ` · 🏆 ${giveaway.winner.name}` : ''}
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selectedId && (
        <GiveawayDetail giveawayId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </>
  );
}
