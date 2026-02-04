import { BaseClient } from './baseClient';
import { ENV } from '../config/env.config';

export class AuthClient extends BaseClient {
  constructor() {
    super(ENV.apiBaseUrl);
  }

  async login(email: string, password: string) {
    return await this.post('/api/v1/auth/login', {
      email,
      password,
    });
  }

  async register(userData: { name: string; email: string; password: string; phone: string }) {
    return await this.post('/api/v1/auth/register', userData);
  }

  async refreshToken(refreshToken: string) {
    return await this.post('/api/v1/auth/refresh', {
      refreshToken,
    });
  }

  async logout(token: string) {
    return await this.post(
      '/api/v1/auth/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }

  async getProfile(token: string) {
    return await this.get('/api/v1/auth/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
