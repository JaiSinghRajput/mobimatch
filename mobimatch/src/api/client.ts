import {
  TokenResponse,
  AppConfigResponse,
  CompatibilityResult,
  ModelSearchItem,
  CompleteProfileRequest,
  UpdateProfileRequest,
  CreateIssueReportRequest,
  CreateModelRequest,
} from '@mobimatch/api-contracts';

const DEFAULT_API_URL = 'http://10.0.2.2:3000';

class UserApiClient {
  private baseUrl: string = DEFAULT_API_URL;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  setTokens(accessToken: string | null, refreshToken: string | null) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  getTokens() {
    return { accessToken: this.accessToken, refreshToken: this.refreshToken };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response: Response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (err) {
      throw new Error('Network connection error. Please check your internet connection.');
    }

    // Auto-refresh token if 401 and refresh token available
    if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/refresh')) {
      const refreshed = await this.refreshSession();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data?.error?.message || `Request failed with status ${response.status}`;
      const code = data?.error?.code || 'API_ERROR';
      const error: any = new Error(message);
      error.code = code;
      error.status = response.status;
      throw error;
    }

    return data as T;
  }

  async getAppConfig(): Promise<AppConfigResponse> {
    return this.request<AppConfigResponse>('/v1/app-config');
  }

  async googleAuth(idToken: string): Promise<TokenResponse> {
    const res = await this.request<TokenResponse>('/v1/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken, clientApp: 'user' }),
    });
    this.setTokens(res.accessToken, res.refreshToken);
    return res;
  }

  async refreshSession(): Promise<boolean> {
    if (!this.refreshToken) return false;
    try {
      const res = await this.request<{ accessToken: string; refreshToken: string }>(
        '/v1/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        }
      );
      this.setTokens(res.accessToken, res.refreshToken);
      return true;
    } catch {
      this.setTokens(null, null);
      return false;
    }
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      await this.request('/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      }).catch(() => {});
    }
    this.setTokens(null, null);
  }

  async logoutAll(): Promise<void> {
    await this.request('/v1/auth/logout-all', {
      method: 'POST',
    });
    this.setTokens(null, null);
  }

  async completeProfile(data: CompleteProfileRequest): Promise<any> {
    return this.request('/v1/users/complete-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProfile(data: UpdateProfileRequest): Promise<any> {
    return this.request('/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAccount(): Promise<any> {
    const res = await this.request('/v1/users/me', {
      method: 'DELETE',
    });
    this.setTokens(null, null);
    return res;
  }

  async getBrands(): Promise<any[]> {
    return this.request('/v1/brands');
  }

  async getBrandModels(brandId: string): Promise<any[]> {
    return this.request(`/v1/brands/${brandId}/models`);
  }

  async getCategories(): Promise<any[]> {
    return this.request('/v1/categories');
  }

  async searchModels(query: string): Promise<ModelSearchItem[]> {
    return this.request(`/v1/models/search?q=${encodeURIComponent(query)}`);
  }

  async getCompatibility(modelId: string, categoryId: string): Promise<CompatibilityResult> {
    return this.request(`/v1/compatibility?modelId=${modelId}&categoryId=${categoryId}`);
  }

  async submitReport(data: CreateIssueReportRequest): Promise<any> {
    return this.request('/v1/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitModelRequest(data: CreateModelRequest): Promise<any> {
    return this.request('/v1/model-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const userApi = new UserApiClient();

