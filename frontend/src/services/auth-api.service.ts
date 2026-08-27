import { ApiClient } from './api-client';

export class AuthApiService {
  static async changePassword(dto: any) {
    return ApiClient.post('/api/auth/change-password', dto);
  }

  static async setupTotp() {
    return ApiClient.post('/api/auth/setup-totp', {});
  }

  static async enableTotp(dto: { code: string }) {
    return ApiClient.post('/api/auth/enable-totp', dto);
  }
}
