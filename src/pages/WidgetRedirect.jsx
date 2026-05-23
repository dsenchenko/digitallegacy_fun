import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
