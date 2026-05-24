import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io({ autoConnect: true, withCredentials: true });

function emitGiveaway(event, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (res) => {
      if (res?.ok) resolve(res);
      else reject(new Error(res?.error ?? 'Помилка операції'));
    });
  });
}

export function useGiveaways() {
  const [giveaways, setGiveaways] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onUpdate = (next) => {
      setGiveaways(next);
      setLoading(false);
    };

    socket.on('giveaways:update', onUpdate);

    fetch('/api/giveaways')
      .then((r) => r.json())
      .then((data) => {
        setGiveaways(data.giveaways ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => socket.off('giveaways:update', onUpdate);
  }, []);

  return { giveaways, loading };
}

export function useGiveawayAdmin(giveawayId) {
  const [giveaway, setGiveaway] = useState(null);
  const [loading, setLoading] = useState(Boolean(giveawayId));
  const [error, setError] = useState('');

  const refresh = () => {
    if (!giveawayId) return Promise.resolve();
    setLoading(true);
    return fetch(`/api/giveaways/${giveawayId}`, { credentials: 'include' })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? 'Не вдалося завантажити');
        setGiveaway(data.giveaway);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    socket.on('giveaways:update', onUpdate);
    return () => socket.off('giveaways:update', onUpdate);
  }, [giveawayId]);

  const addParticipant = (payload) =>
    emitGiveaway('giveaways:addParticipant', { giveawayId, ...payload }).then(
      () => refresh()
    );

  const updateParticipant = (participantId, fields) =>
    emitGiveaway('giveaways:updateParticipant', {
      giveawayId,
      participantId,
      ...fields,
    }).then(() => refresh());

  const removeParticipant = (participantId) =>
    emitGiveaway('giveaways:removeParticipant', {
      giveawayId,
      participantId,
    }).then(() => refresh());

  const drawWinner = () =>
    emitGiveaway('giveaways:draw', { giveawayId }).then((res) => {
      setGiveaway(res.giveaway);
      return res.giveaway;
    });

  const updateGiveaway = (fields) =>
    emitGiveaway('giveaways:update', { giveawayId, ...fields }).then(() =>
      refresh()
    );

  const deleteGiveaway = () =>
    emitGiveaway('giveaways:delete', { giveawayId });

  const setWidgetDisplay = (visible) =>
    emitGiveaway('giveaways:setWidget', { giveawayId, visible }).then((res) => {
      setGiveaway(res.giveaway);
      return res.giveaway;
    });

  return {
    giveaway,
    loading,
    error,
    refresh,
    addParticipant,
    updateParticipant,
    removeParticipant,
    drawWinner,
    updateGiveaway,
    deleteGiveaway,
    setWidgetDisplay,
  };
}

export async function createGiveaway(formData) {
  const res = await fetch('/api/giveaways', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Не вдалося створити розіграш');
  return data.giveaway;
}

export function giveawayStatusLabel(status) {
  if (status === 'open') return 'Відкритий';
  if (status === 'closed') return 'Закритий';
  if (status === 'drawn') return 'Завершений';
  return status;
}
