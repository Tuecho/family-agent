const STORAGE_KEY = 'family_agent_auth';

export function getAuthHeaders(): Record<string, string> {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const { username, password } = JSON.parse(stored);
    if (username && password) {
      return { username, password };
    }
  }
  return {};
}

export function getAuthBasic(): { username: string; password: string } | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const { username, password } = JSON.parse(stored);
    if (username && password) {
      return { username, password };
    }
  }
  return null;
}
