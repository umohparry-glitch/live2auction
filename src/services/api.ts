let csrfTokenMemory: string | null = null;

async function ensureCsrfToken(forceRefresh = false): Promise<string> {
  if (csrfTokenMemory && !forceRefresh) {
    return csrfTokenMemory;
  }
  const res = await fetch('/api/auth/csrf', {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error('Unable to obtain security token.');
  }
  const data = await res.json();
  csrfTokenMemory = data.csrfToken;
  return csrfTokenMemory!;
}

export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isMutating = !['GET', 'HEAD', 'OPTIONS'].includes(method);

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (isMutating) {
    const token = await ensureCsrfToken();
    headers.set('X-CSRF-Token', token);
  }

  let res = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });

  // If CSRF token expired or rotated, refresh once and retry
  if (isMutating && res.status === 403) {
    const cloned = res.clone();
    try {
      const errBody = await cloned.json();
      if (errBody?.code === 'CSRF_INVALID') {
        const freshToken = await ensureCsrfToken(true);
        headers.set('X-CSRF-Token', freshToken);
        res = await fetch(url, {
          ...options,
          method,
          headers,
          credentials: 'include',
        });
      }
    } catch {
      // ignore JSON parse error
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: any = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data?.code;
    err.data = data;
    throw err;
  }
  return data as T;
}
