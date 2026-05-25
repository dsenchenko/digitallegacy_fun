import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminGate from './pages/AdminGate';
import ObsWidget from './pages/ObsWidget';
import PublicLayout from './layouts/PublicLayout';
import ViewerMenuLayout from './pages/ViewerMenuLayout';
import ViewerMenuDonations from './pages/ViewerMenuDonations';
import ViewerMenuGiveaways from './pages/ViewerMenuGiveaways';
import WidgetRedirect, { LegacyWidgetRedirect } from './pages/WidgetRedirect';
import HomePage from './pages/HomePage';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminGate />} />
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route element={<ViewerMenuLayout />}>
            <Route path="/menu" element={<ViewerMenuDonations />} />
            <Route path="/giveaways" element={<ViewerMenuGiveaways />} />
          </Route>
          <Route
            path="/menu/giveaways"
            element={<Navigate to="/giveaways" replace />}
          />
        </Route>
        <Route path="/widgets/:token" element={<ObsWidget />} />
        <Route path="/widgets" element={<WidgetRedirect />} />
        <Route path="/widget/:token" element={<LegacyWidgetRedirect />} />
        <Route path="/widget" element={<Navigate to="/widgets" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
