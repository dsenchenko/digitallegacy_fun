import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDonations, formatDonationMeta } from '../hooks/useDonations';
import { useAuth } from '../hooks/useAuth';
import { useWidgetUrl } from '../hooks/useWidgetUrl';
import { useActiveDebuffs, useCountdown } from '../hooks/useActiveDebuffs';
import '../styles/admin.css';

function ActiveItem({ item, onStop }) {
  const remaining = useCountdown(item.expiresAt);

  return (
    <li className="active-item">
      <div className="active-item__info">
        <p className="active-item__name">{item.name}</p>
        {item.isRandomResult && (
          <p className="active-item__random">🎲 Випадковий дебаф</p>
        )}
        {item.donorName && (
          <p className="active-item__donor">від {item.donorName}</p>
        )}
      </div>
      <div className="active-item__right">
        {item.hasTimer && item.expiresAt ? (
          <span className="active-item__timer">{remaining}</span>
        ) : (
          <span className="active-item__timer active-item__timer--infinite">
            Активно
          </span>
        )}
        <button
          type="button"
          className="active-item__stop"
          onClick={() => onStop(item.id)}
        >
          Зупинити
        </button>
      </div>
    </li>
  );
}

function DonationCard({
  donation,
  onActivate,
  onUpdateName,
  onUpdatePrice,
  onUpdateDuration,
  onDelete,
  busy,
  savingName,
  savingPrice,
  savingDuration,
  deleting,
}) {
  const [donorName, setDonorName] = useState('');
  const [nameInput, setNameInput] = useState(donation.name);
  const [priceInput, setPriceInput] = useState(String(donation.price));
  const [durationInput, setDurationInput] = useState(
    String(donation.durationMinutes ?? 10)
  );
  const [activateDuration, setActivateDuration] = useState('');

  useEffect(() => {
    setNameInput(donation.name);
  }, [donation.name]);

  useEffect(() => {
    setPriceInput(String(donation.price));
  }, [donation.price]);

  useEffect(() => {
    setDurationInput(String(donation.durationMinutes ?? 10));
  }, [donation.durationMinutes]);

  const handleActivate = async () => {
    const override =
      activateDuration.trim() === ''
        ? null
        : Number(activateDuration);
    await onActivate(donation.id, donorName, override);
    setDonorName('');
    setActivateDuration('');
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === donation.name) return;
    await onUpdateName(donation.id, trimmed);
  };

  const handleSavePrice = async () => {
    const parsed = Number(priceInput);
    if (parsed === donation.price) return;
    await onUpdatePrice(donation.id, parsed);
  };

  const handleSaveDuration = async () => {
    const parsed = Number(durationInput);
    if (parsed === donation.durationMinutes) return;
    await onUpdateDuration(donation.id, parsed);
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Видалити донат «${donation.name}»? Цю дію не можна скасувати.`
      )
    ) {
      return;
    }
    await onDelete(donation.id);
  };

  const duration = formatDonationMeta(donation);
  const meta = donation.isRandom
    ? 'Випадковий вибір з ігрових дебафів'
    : duration
      ? `Таймер: ${duration}`
      : 'Потрібна ручна зупинка';
  const priceChanged = Number(priceInput) !== donation.price;
  const nameChanged = nameInput.trim() !== donation.name && nameInput.trim() !== '';
  const durationChanged =
    donation.hasTimer && Number(durationInput) !== donation.durationMinutes;

  return (
    <article
      className={`donation-card${donation.isRandom ? ' donation-card--random' : ''}${donation.isCustom ? ' donation-card--custom' : ''}`}
    >
      <div className="donation-card__price-row">
        <label className="donation-card__price-label">
          Назва
          <div className="donation-card__price-edit donation-card__price-edit--name">
            <input
              className="donation-card__name-input"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              disabled={savingName}
            />
            <button
              type="button"
              className="donation-card__price-save"
              disabled={!nameChanged || savingName}
              onClick={handleSaveName}
            >
              {savingName ? '...' : 'Зберегти'}
            </button>
          </div>
        </label>
      </div>
      <p className="donation-card__meta">{meta}</p>
      <div className="donation-card__price-row">
        <label className="donation-card__price-label">
          Ціна
          <div className="donation-card__price-edit">
            <input
              className="donation-card__price-input"
              type="number"
              min="1"
              step="1"
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              disabled={savingPrice}
            />
            <span className="donation-card__price-currency">
              {donation.currency}
            </span>
            <button
              type="button"
              className="donation-card__price-save"
              disabled={!priceChanged || savingPrice}
              onClick={handleSavePrice}
            >
              {savingPrice ? '...' : 'Зберегти'}
            </button>
          </div>
        </label>
      </div>
      {donation.hasTimer && (
        <div className="donation-card__price-row">
          <label className="donation-card__price-label">
            Тривалість (хв)
            <div className="donation-card__price-edit">
              <input
                className="donation-card__price-input"
                type="number"
                min="1"
                step="1"
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                disabled={savingDuration}
              />
              <button
                type="button"
                className="donation-card__price-save"
                disabled={!durationChanged || savingDuration}
                onClick={handleSaveDuration}
              >
                {savingDuration ? '...' : 'Зберегти'}
              </button>
            </div>
          </label>
        </div>
      )}
      <div className="donation-card__actions">
        {donation.hasTimer && (
          <label className="donation-card__duration-override">
            Таймер при активації (хв, необовʼязково)
            <input
              className="donation-card__input donation-card__input--short"
              type="number"
              min="1"
              step="1"
              placeholder={String(donation.durationMinutes ?? 10)}
              value={activateDuration}
              onChange={(e) => setActivateDuration(e.target.value)}
              disabled={busy}
            />
          </label>
        )}
        <input
          className="donation-card__input"
          type="text"
          placeholder="Ім'я донатера (необов'язково)"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !busy && handleActivate()}
        />
        <button
          type="button"
          className="donation-card__btn"
          disabled={busy || deleting}
          onClick={handleActivate}
        >
          Активувати
        </button>
        <button
          type="button"
          className="donation-card__btn donation-card__btn--danger"
          disabled={busy || deleting}
          onClick={handleDelete}
        >
          {deleting ? '...' : 'Видалити'}
        </button>
      </div>
    </article>
  );
}

function AddDonationForm({ categoryId, onAdd, busy }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('100');
  const [hasTimer, setHasTimer] = useState(true);
  const [durationMinutes, setDurationMinutes] = useState('10');
  const [description, setDescription] = useState('');

  const reset = () => {
    setName('');
    setPrice('100');
    setHasTimer(true);
    setDurationMinutes('10');
    setDescription('');
    setOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onAdd(categoryId, {
      name,
      price: Number(price),
      hasTimer,
      durationMinutes: hasTimer ? Number(durationMinutes) : null,
      description,
    });
    reset();
  };

  if (!open) {
    return (
      <button
        type="button"
        className="catalog-btn catalog-btn--ghost"
        onClick={() => setOpen(true)}
      >
        + Додати донат
      </button>
    );
  }

  return (
    <form className="catalog-form" onSubmit={handleSubmit}>
      <h3 className="catalog-form__title">Новий донат</h3>
      <label className="catalog-form__field">
        Назва
        <input
          className="catalog-form__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <label className="catalog-form__field">
        Ціна (UAH)
        <input
          className="catalog-form__input"
          type="number"
          min="1"
          step="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </label>
      <label className="catalog-form__checkbox">
        <input
          type="checkbox"
          checked={hasTimer}
          onChange={(e) => setHasTimer(e.target.checked)}
        />
        Має таймер
      </label>
      {hasTimer && (
        <label className="catalog-form__field">
          Тривалість (хв)
          <input
            className="catalog-form__input"
            type="number"
            min="1"
            step="1"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            required
          />
        </label>
      )}
      <label className="catalog-form__field">
        Опис (необовʼязково)
        <input
          className="catalog-form__input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <div className="catalog-form__actions">
        <button type="submit" className="catalog-btn" disabled={busy}>
          {busy ? 'Збереження...' : 'Додати'}
        </button>
        <button
          type="button"
          className="catalog-btn catalog-btn--ghost"
          onClick={reset}
        >
          Скасувати
        </button>
      </div>
    </form>
  );
}

function CategorySection({
  category,
  busyId,
  savingNameId,
  savingPriceId,
  savingDurationId,
  savingCategoryId,
  deletingDonationId,
  deletingCategoryId,
  addingDonationCategoryId,
  canDeleteCategory,
  onActivate,
  onUpdateName,
  onUpdatePrice,
  onUpdateDuration,
  onDeleteDonation,
  onDeleteCategory,
  onRenameCategory,
  onAddDonation,
}) {
  const [nameInput, setNameInput] = useState(category.name);

  useEffect(() => {
    setNameInput(category.name);
  }, [category.name]);

  const nameChanged = nameInput.trim() !== category.name;

  const handleDeleteCategory = async () => {
    if (
      !window.confirm(
        `Видалити категорію «${category.name}» та всі її донати? Цю дію не можна скасувати.`
      )
    ) {
      return;
    }
    await onDeleteCategory(category.id);
  };

  return (
    <section className="admin__section">
      <div className="category-header">
        <label className="category-header__field">
          Категорія
          <input
            className="category-header__input"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="catalog-btn catalog-btn--small"
          disabled={!nameChanged || savingCategoryId === category.id}
          onClick={() => onRenameCategory(category.id, nameInput.trim())}
        >
          {savingCategoryId === category.id ? '...' : 'Зберегти назву'}
        </button>
        {canDeleteCategory && (
          <button
            type="button"
            className="catalog-btn catalog-btn--small catalog-btn--danger"
            disabled={deletingCategoryId === category.id}
            onClick={handleDeleteCategory}
          >
            {deletingCategoryId === category.id ? '...' : 'Видалити категорію'}
          </button>
        )}
      </div>
      <div className="admin__grid">
        {category.donations.map((donation) => (
          <DonationCard
            key={donation.id}
            donation={donation}
            busy={busyId === donation.id}
            savingName={savingNameId === donation.id}
            savingPrice={savingPriceId === donation.id}
            savingDuration={savingDurationId === donation.id}
            deleting={deletingDonationId === donation.id}
            onActivate={onActivate}
            onUpdateName={onUpdateName}
            onUpdatePrice={onUpdatePrice}
            onUpdateDuration={onUpdateDuration}
            onDelete={onDeleteDonation}
          />
        ))}
      </div>
      <AddDonationForm
        categoryId={category.id}
        busy={addingDonationCategoryId === category.id}
        onAdd={onAddDonation}
      />
    </section>
  );
}

function AddCategoryForm({ onAdd, busy }) {
  const [name, setName] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onAdd(name.trim());
    setName('');
  };

  return (
    <section className="catalog-add-category admin__section">
      <h2 className="admin__section-title">Нова категорія</h2>
      <form className="catalog-form catalog-form--inline" onSubmit={handleSubmit}>
        <label className="catalog-form__field catalog-form__field--grow">
          Назва категорії
          <input
            className="catalog-form__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Наприклад: Спеціальні нагороди"
            required
          />
        </label>
        <button type="submit" className="catalog-btn" disabled={busy}>
          {busy ? 'Додавання...' : 'Додати категорію'}
        </button>
      </form>
    </section>
  );
}

export default function AdminPanel() {
  const { logout } = useAuth();
  const { active, connected, activate, deactivate, clearAll } =
    useActiveDebuffs();
  const {
    categories,
    updatePrice,
    updateDuration,
    updateName,
    addCategory,
    renameCategory,
    addDonation,
    deleteDonation,
    deleteCategory,
  } = useDonations();
  const { widgetUrl, loading: widgetLoading, regenerate } = useWidgetUrl();
  const [busyId, setBusyId] = useState(null);
  const [savingPriceId, setSavingPriceId] = useState(null);
  const [savingNameId, setSavingNameId] = useState(null);
  const [savingDurationId, setSavingDurationId] = useState(null);
  const [deletingDonationId, setDeletingDonationId] = useState(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState(null);
  const [savingCategoryId, setSavingCategoryId] = useState(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [addingDonationCategoryId, setAddingDonationCategoryId] = useState(null);
  const [error, setError] = useState('');

  const handleActivate = async (donationId, donorName, durationMinutes = null) => {
    setBusyId(donationId);
    setError('');
    try {
      await activate(donationId, donorName, durationMinutes);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdatePrice = async (donationId, price) => {
    setSavingPriceId(donationId);
    setError('');
    try {
      await updatePrice(donationId, price);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPriceId(null);
    }
  };

  const handleUpdateName = async (donationId, name) => {
    setSavingNameId(donationId);
    setError('');
    try {
      await updateName(donationId, name);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingNameId(null);
    }
  };

  const handleUpdateDuration = async (donationId, durationMinutes) => {
    setSavingDurationId(donationId);
    setError('');
    try {
      await updateDuration(donationId, durationMinutes);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingDurationId(null);
    }
  };

  const handleRenameCategory = async (categoryId, name) => {
    setSavingCategoryId(categoryId);
    setError('');
    try {
      await renameCategory(categoryId, name);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingCategoryId(null);
    }
  };

  const handleAddCategory = async (name) => {
    setAddingCategory(true);
    setError('');
    try {
      await addCategory(name);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingCategory(false);
    }
  };

  const handleAddDonation = async (categoryId, donation) => {
    setAddingDonationCategoryId(categoryId);
    setError('');
    try {
      await addDonation(categoryId, donation);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingDonationCategoryId(null);
    }
  };

  const handleDeleteDonation = async (donationId) => {
    setDeletingDonationId(donationId);
    setError('');
    try {
      await deleteDonation(donationId);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingDonationId(null);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    setDeletingCategoryId(categoryId);
    setError('');
    try {
      await deleteCategory(categoryId);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleRegenerateWidget = async () => {
    if (
      !window.confirm(
        'Згенерувати нове посилання? Старе перестане працювати в OBS — потрібно оновити Browser Source.'
      )
    ) {
      return;
    }
    setError('');
    try {
      await regenerate();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopyWidgetUrl = async () => {
    if (!widgetUrl) return;
    try {
      await navigator.clipboard.writeText(widgetUrl);
    } catch {
      setError('Не вдалося скопіювати посилання');
    }
  };

  const menuUrl = `${window.location.origin}/menu`;

  return (
    <main className="admin">
      <header className="admin__header">
        <div>
          <h1 className="admin__title">Адмін-панель донатів</h1>
          <p className="admin__subtitle">
            Керуйте каталогом, цінами та активними дебафами
          </p>
        </div>
        <div className="admin__header-right">
          <Link className="admin__nav-link" to="/admin/giveaways">
            Розіграші
          </Link>
          <a
            className="admin__nav-link"
            href="/menu"
            target="_blank"
            rel="noreferrer"
          >
            Меню для глядачів ↗
          </a>
          <div className="admin__status">
            <span
              className={`admin__status-dot${connected ? ' admin__status-dot--online' : ''}`}
            />
            {connected ? 'Підключено' : 'Відключено'}
          </div>
          <button
            type="button"
            className="catalog-btn catalog-btn--ghost catalog-btn--small"
            onClick={() => logout()}
          >
            Вийти
          </button>
        </div>
      </header>

      {error && <p className="admin__error">{error}</p>}

      <section className="active-panel admin__section">
        <div className="active-panel__header">
          <h2 className="active-panel__title">
            Зараз активні ({active.length})
          </h2>
          {active.length > 0 && (
            <button
              type="button"
              className="active-panel__clear"
              onClick={() => clearAll()}
            >
              Очистити все
            </button>
          )}
        </div>
        {active.length === 0 ? (
          <p className="active-panel__empty">
            Немає активних дебафів або нагород
          </p>
        ) : (
          <ul className="active-list">
            {active.map((item) => (
              <ActiveItem
                key={item.id}
                item={item}
                onStop={(id) => deactivate(id)}
              />
            ))}
          </ul>
        )}
      </section>

      <AddCategoryForm onAdd={handleAddCategory} busy={addingCategory} />

      {categories.map((category) => (
        <CategorySection
          key={category.id}
          category={category}
          busyId={busyId}
          savingNameId={savingNameId}
          savingPriceId={savingPriceId}
          savingDurationId={savingDurationId}
          savingCategoryId={savingCategoryId}
          deletingDonationId={deletingDonationId}
          deletingCategoryId={deletingCategoryId}
          addingDonationCategoryId={addingDonationCategoryId}
          canDeleteCategory={category.id.startsWith('cat-')}
          onActivate={handleActivate}
          onUpdateName={handleUpdateName}
          onUpdatePrice={handleUpdatePrice}
          onUpdateDuration={handleUpdateDuration}
          onDeleteDonation={handleDeleteDonation}
          onDeleteCategory={handleDeleteCategory}
          onRenameCategory={handleRenameCategory}
          onAddDonation={handleAddDonation}
        />
      ))}

      <div className="admin__links">
        <div className="admin__obs-link">
          <strong>Меню для глядачів:</strong>
          <br />
          <code>{menuUrl}</code>
        </div>
        <div className="admin__obs-link">
          <strong>URL віджета OBS (унікальне):</strong>
          <br />
          {widgetLoading ? (
            <code>Завантаження...</code>
          ) : (
            <code>{widgetUrl}</code>
          )}
          <div className="admin__widget-actions">
            <button
              type="button"
              className="catalog-btn catalog-btn--small"
              disabled={!widgetUrl}
              onClick={handleCopyWidgetUrl}
            >
              Копіювати
            </button>
            <button
              type="button"
              className="catalog-btn catalog-btn--small catalog-btn--ghost"
              onClick={handleRegenerateWidget}
            >
              Нове посилання
            </button>
          </div>
          <br />
          <small>
            Ширина 500, висота 400. Вимкніть «Вимкнути джерело, коли не
            видиме». Фон прозорий. Не публікуйте це посилання — воно
            унікальне для вашого стріму.
          </small>
        </div>
      </div>
    </main>
  );
}
