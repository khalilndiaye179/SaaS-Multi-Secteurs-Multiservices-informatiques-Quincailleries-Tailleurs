import { StorageService } from './storage';

export class ApiClient {
  private static getBaseUrl(): string {
    return import.meta.env.VITE_API_BASE_URL || '';
  }

  private static resolveUrl(url: string): string {
    const baseUrl = this.getBaseUrl();
    if (baseUrl && url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }
    return url;
  }

  private static async getHeaders(isPublic = false) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (!isPublic) {
      const token = await StorageService.get('kpsy_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      await StorageService.remove('kpsy_token');
      await StorageService.remove('kpsy_user');
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
    const response = await fetch(this.resolveUrl(url), {
      method: 'GET',
      headers: await this.getHeaders(isPublic),
    });
    return this.handleResponse<T>(response);
  }

  static async post<T>(url: string, body: any, isPublic = false): Promise<T> {
    const response = await fetch(this.resolveUrl(url), {
      method: 'POST',
      headers: await this.getHeaders(isPublic),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  static async put<T>(url: string, body: any, isPublic = false): Promise<T> {
    const response = await fetch(this.resolveUrl(url), {
      method: 'PUT',
      headers: await this.getHeaders(isPublic),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }

  static async patch<T>(url: string, body: any, isPublic = false): Promise<T> {
    const response = await fetch(this.resolveUrl(url), {
      method: 'PATCH',
      headers: await this.getHeaders(isPublic),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(response);
  }
  static async delete<T>(url: string, isPublic = false): Promise<T> {
    const response = await fetch(this.resolveUrl(url), {
      method: 'DELETE',
      headers: await this.getHeaders(isPublic),
    });
    return this.handleResponse<T>(response);
  }
}
