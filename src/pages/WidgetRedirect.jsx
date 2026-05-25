import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

export function LegacyWidgetRedirect() {
  const { token } = useParams();
  return <Navigate to={`/widgets/${token}`} replace />;
}

export default function WidgetRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/widget')
      .then((r) => r.json())
      .then((data) => navigate(data.path, { replace: true }))
      .catch(() => navigate('/admin', { replace: true }));
  }, [navigate]);

  return null;
}
