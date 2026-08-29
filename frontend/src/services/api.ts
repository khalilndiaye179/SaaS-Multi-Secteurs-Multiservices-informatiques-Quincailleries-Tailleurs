import { StorageService } from './storage';

const getToken = async () => await StorageService.get('kpsy_token');

export const api = {
  get: async (url: string) => {
    const res = await fetch('/api' + url, {
      headers: { Authorization: `Bearer ${await getToken()}` }
    });
    if (!res.ok) throw new Error('Erreur API');
    return res.json();
  },
  post: async (url: string, data: any) => {
    const res = await fetch('/api' + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erreur API');
    return res.json();
  },
  put: async (url: string, data: any) => {
    const res = await fetch('/api' + url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erreur API');
    return res.json();
  },
  delete: async (url: string) => {
    const res = await fetch('/api' + url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${await getToken()}` }
    });
    if (!res.ok) throw new Error('Erreur API');
    return res.json();
  }
};
