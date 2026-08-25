export class ApiClient {
  private static getHeaders(isPublic = false) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (!isPublic) {
      const token = localStorage.getItem('kpsy_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      localStorage.removeItem('kpsy_token');
      localStorage.removeItem('kpsy_user');
      window.dispatchEvent(new CustomEvent('kpsy:unauthorized'));
      throw new Error('401: Session expirée ou authentification requise.');
    }

    if (response.status === 403) {
      throw new Error('403: Accès refusé par le serveur NestJS (Permissions insuffisantes).');
    }

    if (response.status === 409) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`409: ${body.message || 'Conflit métier détecté.'}`);
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || `Erreur serveur HTTP ${response.status}`);
    }

    return response.json();
  }

  static async get<T>(url: string, isPublic = false): Promise<T> {
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(isPublic),
    });
    return this.handleResponse<T>(response);
  }

  static async post<T>(url: string, body: any, isPublic = false): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(isPublic),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  static async put<T>(url: string, body: any, isPublic = false): Promise<T> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(isPublic),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  static async patch<T>(url: string, body: any, isPublic = false): Promise<T> {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(isPublic),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }
  static async delete<T>(url: string, isPublic = false): Promise<T> {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(isPublic),
    });
    return this.handleResponse<T>(response);
  }
}
