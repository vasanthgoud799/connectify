export function getToken() {
  return localStorage.getItem('auth_token');
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    const token = data?.token as string | undefined;
    if (token) {
      localStorage.setItem('auth_token', token);
      return token;
    }
    return null;
  } catch {
    return null;
  }
}

export async function api(path: string, init: RequestInit = {}) {
  let token = getToken();
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res = await fetch(path, { ...init, headers });
  if (res.status === 401) {
    token = await refreshAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      res = await fetch(path, { ...init, headers });
    }
  }
  if (!res.ok) throw new Error(`${init.method || 'GET'} ${path} failed`);
  if (res.status === 204 || res.headers.get('content-length') === '0') return null as any;
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) return null as any;
  return res.json();
}
