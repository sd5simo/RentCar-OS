"use client";
/**
 * useDataLoader — call this ONCE in the root admin layout.
 * It fires loadAll() on mount and exposes loading/error state.
 * Subsequent navigations within the app don't re-fetch (data lives in store).
 * Call `reload()` to force a full refresh.
 */
import { useEffect, useRef } from "react";
import { useStore } from "@/store";

export function useDataLoader() {
  const { loadAll, loading, error } = useStore();
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    loadAll();
  }, [loadAll]);

  const reload = () => {
    loaded.current = false;
    loadAll();
  };

  return { loading, error, reload };
}
