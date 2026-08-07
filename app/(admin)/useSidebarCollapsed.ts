"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "gz-sidebar-collapsed";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function getServerSnapshot() {
  return false;
}

/** Estado de colapso del sidebar, persistido en localStorage (self-contained, sin lift-state). */
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "0" : "1");
    // El evento "storage" nativo solo se dispara en OTRAS pestañas — se
    // despacha uno manualmente para que useSyncExternalStore también
    // refresque esta misma pestaña.
    window.dispatchEvent(new Event("storage"));
  }

  return { collapsed, toggle };
}
