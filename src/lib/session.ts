const SESSION_KEY = "incherry_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export type SessionUser = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  role?: "ADMIN" | "USER";
};

type StoredSession = SessionUser & { expiresAt: number };

export function saveSession(user: SessionUser): void {
  const session: StoredSession = {
    ...user,
    expiresAt: Date.now() + SESSION_DURATION_MS
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null;

  try {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;

    const { expiresAt, ...user }: StoredSession = JSON.parse(session);
    if (Date.now() > expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}