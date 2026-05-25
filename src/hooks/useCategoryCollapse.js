import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'dl-admin-category-expanded';

function readExpandedMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeExpandedMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private mode */
  }
}

function pruneMap(map, categoryIds) {
  const next = {};
  for (const id of categoryIds) {
    if (map[id] === true || map[id] === false) next[id] = map[id];
  }
  const changed =
    Object.keys(next).length !== Object.keys(map).length ||
    Object.entries(next).some(([id, value]) => map[id] !== value);
  return { next, changed };
}

export function useCategoryCollapse(categoryIds) {
  const [expandedMap, setExpandedMap] = useState(readExpandedMap);

  useEffect(() => {
    setExpandedMap((prev) => {
      const { next, changed } = pruneMap(prev, categoryIds);
      if (changed) writeExpandedMap(next);
      return changed ? next : prev;
    });
  }, [categoryIds]);

  const isExpanded = useCallback(
    (categoryId) => expandedMap[categoryId] === true,
    [expandedMap]
  );

  const setExpanded = useCallback((categoryId, shouldExpand) => {
    setExpandedMap((prev) => {
      const next = { ...prev, [categoryId]: shouldExpand };
      if (!shouldExpand) next[categoryId] = false;
      writeExpandedMap(next);
      return next;
    });
  }, []);

  const toggle = useCallback((categoryId) => {
    setExpandedMap((prev) => {
      const next = { ...prev, [categoryId]: prev[categoryId] !== true };
      writeExpandedMap(next);
      return next;
    });
  }, []);

  const expand = useCallback(
    (categoryId) => setExpanded(categoryId, true),
    [setExpanded]
  );

  return { isExpanded, toggle, expand };
}
