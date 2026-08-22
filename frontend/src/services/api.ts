const getToken = () => localStorage.getItem('kpsy_token');

export const api = {
  get: async (url: string) => {
    const res = await fetch('/api' + url, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error('Erreur API');
    return res.json();
  },
  post: async (url: string, data: any) => {
    const res = await fetch('/api' + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erreur API');
    return res.json();
  },
  put: async (url: string, data: any) => {
    const res = await fetch('/api' + url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Erreur API');
    return res.json();
  },
  delete: async (url: string) => {
    const res = await fetch('/api' + url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error('Erreur API');
    return res.json();
  }
};
