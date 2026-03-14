export const getProjectSessionKey = (baseKey, projectId) => (
  projectId ? `${baseKey}:${projectId}` : baseKey
);

export const sessionGetString = (baseKey, projectId, fallback = "") => {
  const key = getProjectSessionKey(baseKey, projectId);
  const value = sessionStorage.getItem(key);
  return value ?? fallback;
};

export const sessionSetString = (baseKey, projectId, value) => {
  const key = getProjectSessionKey(baseKey, projectId);
  sessionStorage.setItem(key, value ?? "");
};

export const sessionGetJson = (baseKey, projectId, fallback = null) => {
  const raw = sessionGetString(baseKey, projectId, "");
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return fallback;
  }
};

export const sessionSetJson = (baseKey, projectId, value) => {
  const key = getProjectSessionKey(baseKey, projectId);
  sessionStorage.setItem(key, JSON.stringify(value));
};
