const API_BASE_URL = '/api';

export interface VehiclePhoto {
  id: string;
  fileName: string;
  storagePath: string;
  isMain: boolean;
  order: number;
}

export const photoService = {
  getPhotos: async (vehicleId: string): Promise<VehiclePhoto[]> => {
    const token = localStorage.getItem('autonexus_token');
    const res = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/photos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erro ao carregar fotos.');
    return res.json();
  },

  uploadPhotos: async (vehicleId: string, files: FileList | File[]): Promise<VehiclePhoto[]> => {
    const token = localStorage.getItem('autonexus_token');
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('files', file));

    const res = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/photos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Erro no upload' }));
      throw new Error(err.message || 'Erro no upload de fotos.');
    }
    return res.json();
  },

  setMainPhoto: async (vehicleId: string, photoId: string): Promise<void> => {
    const token = localStorage.getItem('autonexus_token');
    const res = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/photos/${photoId}/main`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erro ao definir foto principal.');
  },

  deletePhoto: async (vehicleId: string, photoId: string): Promise<void> => {
    const token = localStorage.getItem('autonexus_token');
    const res = await fetch(`${API_BASE_URL}/vehicles/${vehicleId}/photos/${photoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Erro ao excluir foto.');
  }
};
