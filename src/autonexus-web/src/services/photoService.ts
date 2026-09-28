const API_BASE_URL = '/api';

export interface VehiclePhoto {
  id: string;
  fileName?: string;
  storagePath?: string;
  url?: string;
  isMain?: boolean;
  order?: number;
}

/**
 * Recupera o token do usuário.
 */
const getToken = (): string | null => {
  return localStorage.getItem(
    'autonexus_token'
  );
};

/**
 * Monta headers autenticados.
 */
const getHeaders = (): HeadersInit => {

  const token = getToken();

  const headers: HeadersInit = {};

  if (token) {

    headers.Authorization =
      `Bearer ${token}`;
  }

  return headers;
};

/**
 * Normaliza a resposta da API.
 */
const normalizePhotosResponse = (
  response: any
): VehiclePhoto[] => {

  if (Array.isArray(response)) {
    return response;
  }

  if (
    response &&
    Array.isArray(response.photos)
  ) {

    return response.photos;
  }

  if (
    response &&
    Array.isArray(response.data)
  ) {

    return response.data;
  }

  return [];
};

export const photoService = {

  /**
   * =========================================================
   * LISTAR FOTOS
   * =========================================================
   */
  getPhotos: async (
    vehicleId: string
  ): Promise<VehiclePhoto[]> => {

    const res = await fetch(
      `${API_BASE_URL}/vehicles/${vehicleId}/photos`,
      {
        method: 'GET',
        headers: getHeaders()
      }
    );

    if (!res.ok) {

      const error =
        await res.json().catch(
          () => null
        );

      throw new Error(
        error?.message ||
        error?.title ||
        'Erro ao carregar fotos.'
      );
    }

    const response =
      await res.json();

    console.log(
      '📸 photoService.getPhotos:',
      response
    );

    return normalizePhotosResponse(
      response
    );
  },

  /**
   * =========================================================
   * UPLOAD
   * =========================================================
   */
  uploadPhotos: async (
    vehicleId: string,
    files: FileList | File[]
  ): Promise<VehiclePhoto[]> => {

    const formData =
      new FormData();

    Array.from(files).forEach(
      (file) => {

        formData.append(
          'files',
          file
        );
      }
    );

    const res = await fetch(
      `${API_BASE_URL}/vehicles/${vehicleId}/photos`,
      {
        method: 'POST',

        headers: getHeaders(),

        body: formData
      }
    );

    if (!res.ok) {

      const err =
        await res.json().catch(
          () => ({
            message:
              'Erro no upload'
          })
        );

      throw new Error(
        err?.message ||
        err?.title ||
        'Erro no upload de fotos.'
      );
    }

    const response =
      await res.json();

    console.log(
      '📤 photoService.uploadPhotos:',
      response
    );

    return normalizePhotosResponse(
      response
    );
  },

  /**
   * =========================================================
   * DEFINIR FOTO PRINCIPAL
   * =========================================================
   */
  setMainPhoto: async (
    vehicleId: string,
    photoId: string
  ): Promise<void> => {

    const res = await fetch(
      `${API_BASE_URL}/vehicles/${vehicleId}/photos/${photoId}/main`,
      {
        method: 'PATCH',
        headers: getHeaders()
      }
    );

    if (!res.ok) {

      const error =
        await res.json().catch(
          () => null
        );

      throw new Error(
        error?.message ||
        error?.title ||
        'Erro ao definir foto principal.'
      );
    }
  },

  /**
   * =========================================================
   * EXCLUIR FOTO
   * =========================================================
   */
  deletePhoto: async (
    vehicleId: string,
    photoId: string
  ): Promise<void> => {

    const res = await fetch(
      `${API_BASE_URL}/vehicles/${vehicleId}/photos/${photoId}`,
      {
        method: 'DELETE',
        headers: getHeaders()
      }
    );

    if (!res.ok) {

      const error =
        await res.json().catch(
          () => null
        );

      throw new Error(
        error?.message ||
        error?.title ||
        'Erro ao excluir foto.'
      );
    }
  }
};