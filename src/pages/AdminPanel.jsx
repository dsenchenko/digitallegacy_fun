import { useEffect, useMemo, useState } from 'react';
import { useDonations, formatDonationMeta } from '../hooks/useDonations';
import { useWidgetUrl } from '../hooks/useWidgetUrl';
import { useActiveDebuffs, useCountdown } from '../hooks/useActiveDebuffs';
import { useCategoryCollapse } from '../hooks/useCategoryCollapse';
import '../styles/admin.css';

function ActiveItem({ item, onStop, onAdjustTime, paused, pausedAt }) {
  const remaining = useCountdown(item.expiresAt, undefined, { paused, pausedAt });
  const hasTimer = item.hasTimer && item.expiresAt;

  const handleAdjust = (deltaSeconds) => {
    onAdjustTime(item.id, deltaSeconds);
  };

  return (
    <li className={`active-item${paused ? ' active-item--paused' : ''}`}>
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
        {hasTimer ? (
          <div className="active-item__time-controls">
            <button
              type="button"
              className="active-item__skip"
              onClick={() => handleAdjust(-LIVE_SKIP_SECONDS)}
              title="Зменшити на 30 секунд"
              aria-label="Зменшити на 30 секунд"
            >
              −30 с
            </button>
            <span className="active-item__timer" aria-live="polite">
              {paused ? '⏸ ' : ''}
              {remaining}
            </span>
            <button
              type="button"
              className="active-item__skip"
              onClick={() => handleAdjust(LIVE_SKIP_SECONDS)}
              title="Додати 30 секунд"
              aria-label="Додати 30 секунд"
            >
              +30 с
            </button>
          </div>
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

const LIVE_SKIP_SECONDS = 30;

function getActiveDebuffForDonation(donationId, active) {
  return active.find((item) => item.donationId === donationId) ?? null;
}

function DonationCardLiveOverlay({
  activeItem,
  paused,
  pausedAt,
  onAdjustTime,
  onStop,
}) {
  const remaining = useCountdown(activeItem.expiresAt, undefined, {
    paused,
    pausedAt,
  });
  const hasTimer = activeItem.hasTimer && activeItem.expiresAt;

  const handleAdjust = (deltaSeconds) => {
    onAdjustTime(activeItem.id, deltaSeconds);
  };

  return (
    <div className="donation-card__live-overlay">
      <div className="donation-card__live-head">
        <p className="donation-card__live-title">{activeItem.name}</p>
        <div className="donation-card__live-meta-slot">
          {activeItem.isRandomResult && (
            <p className="donation-card__live-meta">🎲 Випадковий дебаф</p>
          )}
          {activeItem.donorName && (
            <p className="donation-card__live-meta">від {activeItem.donorName}</p>
          )}
        </div>
      </div>
      <div className="donation-card__live-center">
        {hasTimer ? (
          <div className="donation-card__live-timer" aria-live="polite">
            {paused && (
              <span className="donation-card__live-paused" aria-hidden="true">
                ⏸{' '}
              </span>
            )}
            {remaining}
          </div>
        ) : (
          <p className="donation-card__live-timer donation-card__live-timer--infinite">
            Активно
          </p>
        )}
      </div>
      <div className="donation-card__live-foot">
        <div className="donation-card__live-actions">
          {hasTimer && (
            <button
              type="button"
              className="donation-card__live-skip"
              onClick={() => handleAdjust(-LIVE_SKIP_SECONDS)}
              title="Зменшити на 30 секунд"
              aria-label="Зменшити на 30 секунд"
            >
              −30 с
            </button>
          )}
          <button
            type="button"
            className="donation-card__live-stop"
            onClick={() => onStop(activeItem.id)}
            aria-label="Зупинити"
            title="Зупинити"
          />
          {hasTimer && (
            <button
              type="button"
              className="donation-card__live-skip"
              onClick={() => handleAdjust(LIVE_SKIP_SECONDS)}
              title="Додати 30 секунд"
              aria-label="Додати 30 секунд"
            >
              +30 с
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DonationCard({
  donation,
  activeDebuffs,
  paused,
  pausedAt,
  onActivate,
  onAdjustTime,
  onStop,
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
  const activeItem = getActiveDebuffForDonation(donation.id, activeDebuffs);
  const isActive = activeItem !== null;
  const [donorName, setDonorName] = useState('');
  const [nameInput, setNameInput] = useState(donation.name);
  const [priceInput, setPriceInput] = useState(String(donation.price));
  const [durationInput, setDurationInput] = useState(
    String(donation.durationMinutes ?? 0)
  );

  useEffect(() => {
    setNameInput(donation.name);
  }, [donation.name]);

  useEffect(() => {
    setPriceInput(String(donation.price));
  }, [donation.price]);

  useEffect(() => {
    setDurationInput(String(donation.durationMinutes ?? 0));
  }, [donation.durationMinutes]);

  const handleActivate = async () => {
    await onActivate(donation.id, donorName);
    setDonorName('');
  };

  const handleBlurName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameInput(donation.name);
      return;
    }
    if (trimmed === donation.name) return;
    try {
      await onUpdateName(donation.id, trimmed);
    } catch {
      setNameInput(donation.name);
    }
  };

  const handleBlurPrice = async () => {
    const parsed = Number(priceInput);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setPriceInput(String(donation.price));
      return;
    }
    if (parsed === donation.price) return;
    try {
      await onUpdatePrice(donation.id, parsed);
    } catch {
      setPriceInput(String(donation.price));
    }
  };

  const handleBlurDuration = async () => {
    const parsed = Number(durationInput);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setDurationInput(String(donation.durationMinutes ?? 0));
      return;
    }
    if (parsed === (donation.durationMinutes ?? 0)) return;
    try {
      await onUpdateDuration(donation.id, parsed);
    } catch {
      setDurationInput(String(donation.durationMinutes ?? 0));
    }
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
      : 'Без таймера — до ручного зняття';

  return (
    <article
      className={`donation-card${isActive ? ' donation-card--live' : ''}${donation.isRandom ? ' donation-card--random' : ''}${donation.isCustom ? ' donation-card--custom' : ''}`}
      aria-current={isActive ? 'true' : undefined}
    >
      <button
        type="button"
        className="donation-card__close"
        disabled={busy || deleting}
        onClick={handleDelete}
        aria-label={`Видалити «${donation.name}»`}
        title="Видалити"
      >
        {deleting ? '…' : '×'}
      </button>

      <div className="donation-card__body">
        <div className="donation-card__name-block">
          <div className="donation-card__name-row">
            <span className="donation-card__name-row__title">Назва</span>
            <span className="donation-card__meta">{meta}</span>
          </div>
          <input
            className="donation-card__name-input"
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleBlurName}
            disabled={savingName}
          />
        </div>
        <div
          className={`donation-card__fields-row${donation.isRandom ? ' donation-card__fields-row--price-only' : ''}`}
        >
          <label className="donation-card__price-label donation-card__price-label--price">
            Ціна
            <div className="donation-card__price-edit">
              <input
                className="donation-card__price-input"
                type="number"
                min="1"
                step="1"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                onBlur={handleBlurPrice}
                disabled={savingPrice}
              />
              <span className="donation-card__price-currency">
                {donation.currency}
              </span>
            </div>
          </label>
          {!donation.isRandom && (
            <label className="donation-card__price-label donation-card__price-label--duration">
              Тривалість
              <div className="donation-card__price-edit">
                <input
                  className="donation-card__price-input"
                  type="number"
                  min="0"
                  step="1"
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                  onBlur={handleBlurDuration}
                  disabled={savingDuration}
                />
              </div>
            </label>
          )}
        </div>
        <label className="donation-card__price-label">
          Ім&apos;я донатера
          <input
            className="donation-card__name-input"
            type="text"
            placeholder="Необов'язково"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !busy && handleActivate()}
            disabled={busy || deleting}
          />
        </label>
      </div>

      {isActive && activeItem && (
        <DonationCardLiveOverlay
          activeItem={activeItem}
          paused={paused}
          pausedAt={pausedAt}
          onAdjustTime={onAdjustTime}
          onStop={onStop}
        />
      )}

      <button
        type="button"
        className={`donation-card__btn donation-card__btn--activate${isActive ? ' donation-card__btn--live' : ''}`}
        disabled={busy || deleting || isActive}
        onClick={handleActivate}
        aria-pressed={isActive}
      >
        {isActive ? 'Активно' : 'Активувати'}
      </button>
    </article>
  );
}

function AddDonationForm({ categoryId, onAdd, busy, onClose }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('100');
  const [durationMinutes, setDurationMinutes] = useState('10');
  const [description, setDescription] = useState('');

  const reset = () => {
    setName('');
    setPrice('100');
    setDurationMinutes('10');
    setDescription('');
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onAdd(categoryId, {
      name,
      price: Number(price),
      durationMinutes: Number(durationMinutes),
      description,
    });
    reset();
  };

  return (
    <form className="catalog-form catalog-form--category-add" onSubmit={handleSubmit}>
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
      <label className="catalog-form__field">
        Тривалість (хв, 0 = без таймера)
        <input
          className="catalog-form__input"
          type="number"
          min="0"
          step="1"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          required
        />
      </label>
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
  expanded,
  onToggle,
  onEnsureExpanded,
  activeDebuffs,
  paused,
  pausedAt,
  onAdjustTime,
  onStop,
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
  const [addFormOpen, setAddFormOpen] = useState(false);

  useEffect(() => {
    setNameInput(category.name);
  }, [category.name]);

  const handleOpenAdd = () => {
    onEnsureExpanded();
    setAddFormOpen(true);
  };

  const handleBlurCategoryName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameInput(category.name);
      return;
    }
    if (trimmed === category.name) return;
    try {
      await onRenameCategory(category.id, trimmed);
    } catch {
      setNameInput(category.name);
    }
  };
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
    <section
      className={`admin__section category-section${expanded ? '' : ' category-section--collapsed'}`}
    >
      <div className="category-header">
        <button
          type="button"
          className="category-header__toggle"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={
            expanded ? 'Згорнути категорію' : 'Розгорнути категорію'
          }
        >
          <span
            className={`category-header__chevron${expanded ? ' category-header__chevron--open' : ''}`}
            aria-hidden="true"
          />
        </button>
        <label className="category-header__field">
          <span className="category-header__label">Категорія</span>
          <input
            className="category-header__input"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleBlurCategoryName}
            disabled={savingCategoryId === category.id}
          />
        </label>
        <div className="category-header__actions">
          {!addFormOpen && (
            <button
              type="button"
              className="catalog-btn catalog-btn--ghost category-header__add-btn"
              onClick={handleOpenAdd}
            >
              + Додати донат
            </button>
          )}
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
      </div>
      {expanded && (
        <div className="category-section__body">
          <div className="admin__grid">
            {category.donations.map((donation) => (
              <DonationCard
                key={donation.id}
                donation={donation}
                activeDebuffs={activeDebuffs}
                paused={paused}
                pausedAt={pausedAt}
                onAdjustTime={onAdjustTime}
                onStop={onStop}
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
          {addFormOpen && (
            <AddDonationForm
              categoryId={category.id}
              busy={addingDonationCategoryId === category.id}
              onAdd={onAddDonation}
              onClose={() => setAddFormOpen(false)}
            />
          )}
        </div>
      )}
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
  const {
    active,
    paused,
    pausedAt,
    activate,
    deactivate,
    clearAll,
    pauseAll,
    resumeAll,
    adjustTime,
  } = useActiveDebuffs();
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
  const categoryIds = useMemo(
    () => categories.map((category) => category.id),
    [categories]
  );
  const { isExpanded, toggle, expand } = useCategoryCollapse(categoryIds);
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

  const handleActivate = async (donationId, donorName) => {
    setBusyId(donationId);
    setError('');
    try {
      await activate(donationId, donorName);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleAdjustTime = async (activeId, deltaSeconds) => {
    setError('');
    try {
      await adjustTime(activeId, deltaSeconds);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdatePrice = async (donationId, price) => {
    setSavingPriceId(donationId);
    setError('');
    try {
      await updatePrice(donationId, price);
    } catch (err) {
      setError(err.message);
      throw err;
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
      throw err;
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
      throw err;
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
      throw err;
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
    <>
      <div className="admin__page-header">
        <h1 className="admin__title">Адмін-панель донатів</h1>
        <p className="admin__subtitle">
          Керуйте каталогом, цінами та активними дебафами
        </p>
      </div>

      {error && <p className="admin__error">{error}</p>}

      <section className="active-panel admin__section">
        <div className="active-panel__header">
          <h2 className="active-panel__title">
            Зараз активні ({active.length})
            {paused && (
              <span className="active-panel__paused-badge">Пауза</span>
            )}
          </h2>
          {active.length > 0 && (
            <div className="active-panel__actions">
              <button
                type="button"
                className={`active-panel__pause${paused ? ' active-panel__pause--resume' : ''}`}
                onClick={() => (paused ? resumeAll() : pauseAll())}
              >
                {paused ? 'Продовжити' : 'Пауза всіх'}
              </button>
              <button
                type="button"
                className="active-panel__clear"
                onClick={() => clearAll()}
              >
                Очистити все
              </button>
            </div>
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
                paused={paused}
                pausedAt={pausedAt}
                onStop={(id) => deactivate(id)}
                onAdjustTime={handleAdjustTime}
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
          expanded={isExpanded(category.id)}
          onToggle={() => toggle(category.id)}
          onEnsureExpanded={() => expand(category.id)}
          activeDebuffs={active}
          paused={paused}
          pausedAt={pausedAt}
          onAdjustTime={handleAdjustTime}
          onStop={(id) => deactivate(id)}
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
    </>
  );
}
