import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io({ autoConnect: true, withCredentials: true });

export function useActiveDebuffs() {
  const [active, setActive] = useState([]);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onUpdate = (next) => setActive(next);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('active:update', onUpdate);

    fetch('/api/active')
      .then((r) => r.json())
      .then((data) => setActive(data.active))
      .catch(() => {});

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('active:update', onUpdate);
    };
  }, []);

  const activate = (donationId, donorName = '', durationMinutes = null) =>
    new Promise((resolve, reject) => {
      socket.emit(
        'active:activate',
        { donationId, donorName, durationMinutes },
        (res) => {
          if (res?.ok) resolve(res.debuff);
          else reject(new Error(res?.error ?? 'Не вдалося активувати'));
        }
      );
    });

  const deactivate = (id) =>
    new Promise((resolve, reject) => {
      socket.emit('active:deactivate', { id }, (res) => {
        if (res?.ok) resolve();
        else reject(new Error('Не вдалося деактивувати'));
      });
    });

  const clearAll = () =>
    new Promise((resolve, reject) => {
      socket.emit('active:clear', {}, (res) => {
        if (res?.ok) resolve();
        else reject(new Error('Не вдалося очистити'));
      });
    });

  return { active, connected, activate, deactivate, clearAll };
}

export function useTimerExpired(onExpired) {
  useEffect(() => {
    const handler = (expired) => {
      const timed = expired.filter((item) => item.hasTimer && item.expiresAt);
      if (timed.length > 0) onExpired(timed);
    };
    socket.on('active:expired', handler);
    return () => socket.off('active:expired', handler);
  }, [onExpired]);
}

export function formatRemaining(expiresAt) {
  if (!expiresAt) return null;
  const ms = Math.max(0, expiresAt - Date.now());
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function useCountdown(expiresAt, onComplete) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => tick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [expiresAt]);

  useEffect(() => {
    if (!expiresAt || !onComplete) return;
    const ms = expiresAt - Date.now();
    if (ms <= 0) return;
    const id = setTimeout(onComplete, ms);
    return () => clearTimeout(id);
  }, [expiresAt, onComplete]);

  return formatRemaining(expiresAt);
}
