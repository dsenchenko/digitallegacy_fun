import { useEffect, useState } from 'react';

export function useWidgetUrl() {
  const [widgetPath, setWidgetPath] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/widget', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setWidgetPath(data.path);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const regenerate = () =>
    fetch('/api/widget/regenerate', { method: 'POST', credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setWidgetPath(data.path);
        return data;
      });

  const widgetUrl =
    widgetPath && typeof window !== 'undefined'
      ? `${window.location.origin}${widgetPath}`
      : '';

  return { widgetPath, widgetUrl, loading, regenerate };
}
