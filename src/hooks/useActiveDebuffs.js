import { useCallback, useEffect, useState } from 'react';
import { emitWithAck, socket } from '../socket';

function parseActivePayload(payload) {
  if (Array.isArray(payload)) {
    return { active: payload, paused: false, pausedAt: null };
  }
  return {
    active: payload?.active ?? [],
    paused: Boolean(payload?.paused),
    pausedAt: payload?.pausedAt ?? null,
  };
}

export function effectiveNow(paused, pausedAt) {
  return paused && pausedAt ? pausedAt : Date.now();
}

export function useActiveDebuffs() {
  const [active, setActive] = useState([]);
  const [paused, setPaused] = useState(false);
  const [pausedAt, setPausedAt] = useState(null);
  const [connected, setConnected] = useState(socket.connected);

  const applyPayload = useCallback((payload) => {
    const next = parseActivePayload(payload);
    setActive(next.active);
    setPaused(next.paused);
    setPausedAt(next.pausedAt);
  }, []);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onUpdate = (payload) => applyPayload(payload);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('active:update', onUpdate);

    fetch('/api/active')
      .then((r) => r.json())
      .then((data) => applyPayload(data))
      .catch(() => {});

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('active:update', onUpdate);
    };
  }, [applyPayload]);

  const activate = (donationId, donorName = '') =>
    emitWithAck('active:activate', { donationId, donorName }).then(
      (res) => res.debuff
    );

  const deactivate = (id) => emitWithAck('active:deactivate', { id });

  const clearAll = () => emitWithAck('active:clear', {});

  const setPausedAll = (shouldPause) =>
    emitWithAck('active:setPaused', { paused: shouldPause }).then((res) => {
      applyPayload(res);
      return res;
    });

  const pauseAll = () => setPausedAll(true);
  const resumeAll = () => setPausedAll(false);

  const adjustTime = (id, deltaSeconds) =>
    emitWithAck('active:adjustTime', { id, deltaSeconds }).then((res) => res.debuff);

  return {
    active,
    paused,
    pausedAt,
    connected,
    activate,
    deactivate,
    clearAll,
    pauseAll,
    resumeAll,
    setPausedAll,
    adjustTime,
  };
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

export function formatRemaining(expiresAt, now = Date.now()) {
  if (!expiresAt) return null;
  const ms = Math.max(0, expiresAt - now);
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function useCountdown(expiresAt, onComplete, { paused = false, pausedAt = null } = {}) {
  const [, tick] = useState(0);
  const frozen = paused && pausedAt;
  const now = frozen ? pausedAt : Date.now();

  useEffect(() => {
    if (!expiresAt || frozen) return;
    const id = setInterval(() => tick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [expiresAt, frozen]);

  useEffect(() => {
    if (!expiresAt || !onComplete || frozen) return;
    const ms = expiresAt - Date.now();
    if (ms <= 0) return;
    const id = setTimeout(onComplete, ms);
    return () => clearTimeout(id);
  }, [expiresAt, onComplete, frozen]);

  return formatRemaining(expiresAt, now);
}
