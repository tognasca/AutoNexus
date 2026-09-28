export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {

  const token = localStorage.getItem('autonexus_token');

  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // NÃO definir Content-Type quando body for FormData.
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {

    let message = `Erro HTTP ${response.status}`;

    try {
      const contentType =
        response.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {

        const data = await response.json();

        message =
          data?.message ||
          data?.title ||
          data?.detail ||
          data?.error ||
          message;

      } else {

        const text = await response.text();

        if (text.trim()) {
          message = text;
        }
      }

    } catch {
      // mantém mensagem HTTP
    }

    console.error('❌ API Error:', {
      status: response.status,
      statusText: response.statusText,
      endpoint,
      message
    });

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}