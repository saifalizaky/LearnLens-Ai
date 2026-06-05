export function readJsonStorage(storageKey: string): unknown {
  const storage = getClientStorage();

  if (!storage) {
    return null;
  }

  try {
    const rawValue = storage.getItem(storageKey);

    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    removeStorageItem(storageKey);
    return null;
  }
}

export function writeJsonStorage(storageKey: string, value: unknown) {
  const storage = getClientStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(storageKey, JSON.stringify(value));
  } catch {
    // Ignore storage quota and private browsing failures.
  }
}

export function removeStorageItem(storageKey: string) {
  const storage = getClientStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(storageKey);
  } catch {
    // Ignore private browsing failures.
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getClientStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
