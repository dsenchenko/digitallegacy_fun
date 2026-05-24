import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AdminGate from './pages/AdminGate';
import ObsWidget from './pages/ObsWidget';
import ViewerMenu from './pages/ViewerMenu';
import WidgetRedirect from './pages/WidgetRedirect';
import './styles/global.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminGate />} />
        <Route path="/menu" element={<ViewerMenu />} />
        <Route path="/widget/:token" element={<ObsWidget />} />
        <Route path="/widget" element={<WidgetRedirect />} />
        <Route path="/" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
