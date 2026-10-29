const API_BASE_URL = '/api';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('autonexus_token');

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.endsWith('/auth/login')) {
    // 401 no login significa credenciais inválidas; não é sessão expirada.
    // Nas demais rotas, o token salvo foi rejeitado e deve ser renovado via login.
    localStorage.removeItem('autonexus_token');
    localStorage.removeItem('autonexus_user');
    window.location.replace('/entrar');
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (response.status === 402) {
    const data = await response.json().catch(() => ({ message: 'Assinatura necessária.' }));
    window.dispatchEvent(new CustomEvent('autonexus:subscription-required', { detail: data.message }));
    throw new Error(data.message || 'Assinatura necessária.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido na requisição.' }));
    throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Baixa/abre um arquivo através de um endpoint autenticado (ex.: documento
 * de veículo ou da empresa), em vez de um link estático direto em /uploads
 * — que não passa por nenhuma verificação de autorização no backend.
 * Abre o arquivo numa nova aba (PDFs/imagens) ou dispara o download,
 * dependendo do que o navegador decidir fazer com o tipo de arquivo.
 */
export async function downloadFile(endpoint: string, fileName?: string): Promise<void> {
  const token = localStorage.getItem('autonexus_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });

  if (response.status === 401) {
    localStorage.removeItem('autonexus_token');
    localStorage.removeItem('autonexus_user');
    window.location.replace('/entrar');
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Erro ao baixar arquivo.' }));
    throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);

  if (fileName) {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } else {
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
  }

  // Libera a memória do blob depois de um tempo — tempo suficiente pra
  // aba nova (ou o download) terminar de carregar o conteúdo.
  setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
}