import { useState } from 'react';
import '../styles/admin.css';

export default function AdminLogin({ setup = false, onLogin, onSetup }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (setup && password !== confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }

    setBusy(true);
    try {
      if (setup) {
        await onSetup(password);
      } else {
        await onLogin(password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin admin--auth">
      <section className="admin-auth">
        <h1 className="admin-auth__title">
          {setup ? 'Налаштування пароля' : 'Вхід в адмін-панель'}
        </h1>
        <p className="admin-auth__subtitle">
          {setup
            ? 'Створіть пароль для захисту адмін-панелі. Його можна також задати через ADMIN_PASSWORD.'
            : 'Введіть пароль адміністратора'}
        </p>
        <form className="admin-auth__form" onSubmit={handleSubmit}>
          <label className="admin-auth__field">
            Пароль
            <input
              className="admin-auth__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={setup ? 'new-password' : 'current-password'}
              required
              minLength={setup ? 4 : 1}
            />
          </label>
          {setup && (
            <label className="admin-auth__field">
              Підтвердження пароля
              <input
                className="admin-auth__input"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={4}
              />
            </label>
          )}
          {error && <p className="admin-auth__error">{error}</p>}
          <button type="submit" className="catalog-btn admin-auth__submit" disabled={busy}>
            {busy ? 'Збереження...' : setup ? 'Створити пароль' : 'Увійти'}
          </button>
        </form>
      </section>
    </main>
  );
}
