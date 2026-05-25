import { useEffect, useState } from 'react';
import { emitWithAck, socket } from '../socket';

function emitCatalog(event, payload) {
  return emitWithAck(event, payload);
}

export function useDonations() {
  const [categories, setCategories] = useState([]);
  const [connected, setConnected] = useState(socket.connected);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onUpdate = (next) => {
      setCategories(next);
      setLoading(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('donations:update', onUpdate);

    fetch('/api/donations')
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('donations:update', onUpdate);
    };
  }, []);

  const updatePrice = (donationId, price) =>
    emitCatalog('donations:updatePrice', { donationId, price }).then(
      (res) => res.donation
    );

  const updateDuration = (donationId, durationMinutes) =>
    emitCatalog('donations:updateDuration', { donationId, durationMinutes }).then(
      (res) => res.donation
    );

  const updateName = (donationId, name) =>
    emitCatalog('donations:updateName', { donationId, name }).then(
      (res) => res.donation
    );

  const addCategory = (name) =>
    emitCatalog('donations:addCategory', { name }).then((res) => res.category);

  const renameCategory = (categoryId, name) =>
    emitCatalog('donations:renameCategory', { categoryId, name }).then(
      (res) => res.category
    );

  const addDonation = (categoryId, donation) =>
    emitCatalog('donations:addDonation', { categoryId, donation }).then(
      (res) => res.donation
    );

  const deleteDonation = (donationId) =>
    emitCatalog('donations:deleteDonation', { donationId });

  const deleteCategory = (categoryId) =>
    emitCatalog('donations:deleteCategory', { categoryId });

  return {
    categories,
    connected,
    loading,
    updatePrice,
    updateDuration,
    updateName,
    addCategory,
    renameCategory,
    addDonation,
    deleteDonation,
    deleteCategory,
  };
}

export function formatDonationMeta(donation) {
  if (donation.durationMinutes > 0) {
    return `${donation.durationMinutes} хв`;
  }
  return null;
}
