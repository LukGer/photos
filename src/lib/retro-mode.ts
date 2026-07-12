import { useSyncExternalStore } from "react";

const PARAM = "retro";

const listeners = new Set<() => void>();
let value = false;

function readFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const raw = new URLSearchParams(window.location.search).get(PARAM);
  return raw === "1" || raw === "true";
}

function writeToUrl(next: boolean) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (next) url.searchParams.set(PARAM, "1");
  else url.searchParams.delete(PARAM);
  window.history.replaceState(window.history.state, "", url);
}

function emit() {
  for (const listener of listeners) listener();
}

let initialized = false;
function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  value = readFromUrl();
  // Keep in sync with back/forward navigation.
  window.addEventListener("popstate", () => {
    const next = readFromUrl();
    if (next !== value) {
      value = next;
      emit();
    }
  });
}

function subscribe(listener: () => void): () => void {
  ensureInit();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRetroMode(): boolean {
  return value;
}

export function setRetroMode(next: boolean) {
  ensureInit();
  if (next === value) return;
  value = next;
  writeToUrl(next);
  emit();
}

export function toggleRetroMode() {
  setRetroMode(!value);
}

export function useRetroMode(): boolean {
  return useSyncExternalStore(subscribe, getRetroMode, () => false);
}
