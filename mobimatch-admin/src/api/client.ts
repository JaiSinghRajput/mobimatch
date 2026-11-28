import * as SecureStore from 'expo-secure-store';
import {
  ParsePreviewResponse,
  PublishCompatibilityRequest,
  TokenResponse,
  AppConfigResponse,
} from '@mobimatch/api-contracts';

const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://mobimatch-backend-gw7a.onrender.com';

class AdminApiClient {
  private baseUrl: string = DEFAULT_API_URL;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  setTokens(accessToken: string | null, refreshToken: string | null) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (accessToken && refreshToken) {
      SecureStore.setItemAsync('mobimatch_admin_access_token', accessToken).catch(() => {});
      SecureStore.setItemAsync('mobimatch_admin_refresh_token', refreshToken).catch(() => {});
    } else {
      SecureStore.deleteItemAsync('mobimatch_admin_access_token').catch(() => {});
      SecureStore.deleteItemAsync('mobimatch_admin_refresh_token').catch(() => {});
    }
  }

  async restoreSession(): Promise<any | null> {
    try {
      const [access, refresh] = await Promise.all([
        SecureStore.getItemAsync('mobimatch_admin_access_token'),
        SecureStore.getItemAsync('mobimatch_admin_refresh_token'),
      ]);
      if (!access && !refresh) return null;
      this.accessToken = access;
      this.refreshToken = refresh;
      const user = await this.request<any>('/v1/users/me');
      if (!user?.isAdmin) {
        this.setTokens(null, null);
        return null;
      }
      return user;
    } catch {
      this.setTokens(null, null);
      return null;
    }
  }

  getTokens() {
    return { accessToken: this.accessToken, refreshToken: this.refreshToken };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

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
      body: JSON.stringify({ idToken, clientApp: 'admin' }),
    });
    this.setTokens(res.accessToken, res.refreshToken);
    return res;
  }

  async demoLogin(email: string): Promise<TokenResponse> {
    const res = await this.request<TokenResponse>('/v1/auth/demo', {
      method: 'POST',
      body: JSON.stringify({ email, clientApp: 'admin' }),
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
      }).catch(() => { });
    }
    this.setTokens(null, null);
  }

  // Brands
  async getBrands(): Promise<any[]> {
    return this.request('/v1/admin/brands');
  }

  async createBrand(name: string): Promise<any> {
    return this.request('/v1/admin/brands', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async updateBrand(id: string, name: string): Promise<any> {
    return this.request(`/v1/admin/brands/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  }

  async deactivateBrand(id: string): Promise<any> {
    return this.request(`/v1/admin/brands/${id}/deactivate`, { method: 'POST' });
  }

  async reactivateBrand(id: string): Promise<any> {
    return this.request(`/v1/admin/brands/${id}/reactivate`, { method: 'POST' });
  }

  async deduplicateBrands(): Promise<any> {
    return this.request('/v1/admin/brands/deduplicate', { method: 'POST' });
  }

  async deleteBrand(id: string): Promise<any> {
    return this.request(`/v1/admin/brands/${id}`, { method: 'DELETE' });
  }

  // Categories
  async getCategories(): Promise<any[]> {
    return this.request('/v1/admin/categories');
  }

  async createCategory(name: string): Promise<any> {
    return this.request('/v1/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async updateCategory(id: string, name: string): Promise<any> {
    return this.request(`/v1/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  }

  async deactivateCategory(id: string): Promise<any> {
    return this.request(`/v1/admin/categories/${id}/deactivate`, { method: 'POST' });
  }

  async reactivateCategory(id: string): Promise<any> {
    return this.request(`/v1/admin/categories/${id}/reactivate`, { method: 'POST' });
  }

  async deduplicateCategories(): Promise<any> {
    return this.request('/v1/admin/categories/deduplicate', { method: 'POST' });
  }

  async deleteCategory(id: string): Promise<any> {
    return this.request(`/v1/admin/categories/${id}`, { method: 'DELETE' });
  }

  // Models
  async getModels(): Promise<any[]> {
    return this.request('/v1/admin/models');
  }

  async createModel(brandId: string, name: string, modelNumber?: string): Promise<any> {
    return this.request('/v1/admin/models', {
      method: 'POST',
      body: JSON.stringify({ brandId, name, modelNumber }),
    });
  }

  async updateModel(id: string, data: { brandId?: string; name?: string; modelNumber?: string | null }): Promise<any> {
    return this.request(`/v1/admin/models/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deactivateModel(id: string): Promise<any> {
    return this.request(`/v1/admin/models/${id}/deactivate`, { method: 'POST' });
  }

  async reactivateModel(id: string): Promise<any> {
    return this.request(`/v1/admin/models/${id}/reactivate`, { method: 'POST' });
  }

  async deleteModel(id: string): Promise<any> {
    return this.request(`/v1/admin/models/${id}`, { method: 'DELETE' });
  }

  // Compatibility Groups
  async getCompatibilityGroups(categoryId?: string): Promise<any[]> {
    const q = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
    return this.request(`/v1/admin/compatibility/groups${q}`);
  }

  async updateCompatibilityGroup(
    id: string,
    data: { categoryId?: string; modelIds: string[]; isActive?: boolean }
  ): Promise<any> {
    return this.request(`/v1/admin/compatibility/groups/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCompatibilityGroup(id: string): Promise<any> {
    return this.request(`/v1/admin/compatibility/groups/${id}`, { method: 'DELETE' });
  }

  // Bulk Compatibility
  async parsePreview(categoryId: string, text: string): Promise<ParsePreviewResponse> {
    return this.request<ParsePreviewResponse>('/v1/admin/compatibility/parse-preview', {
      method: 'POST',
      body: JSON.stringify({ categoryId, text }),
    });
  }

  async publishCompatibility(payload: PublishCompatibilityRequest): Promise<any> {
    return this.request('/v1/admin/compatibility/publish', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Users
  async getUsers(): Promise<any[]> {
    return this.request('/v1/admin/users');
  }

  async deactivateUser(id: string): Promise<any> {
    return this.request(`/v1/admin/users/${id}/deactivate`, { method: 'POST' });
  }

  async reactivateUser(id: string): Promise<any> {
    return this.request(`/v1/admin/users/${id}/reactivate`, { method: 'POST' });
  }

  // Reports
  async getReports(): Promise<any[]> {
    return this.request('/v1/admin/reports');
  }

  async updateReportStatus(id: string, status: string): Promise<any> {
    return this.request(`/v1/admin/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Model Requests
  async getModelRequests(): Promise<any[]> {
    return this.request('/v1/admin/model-requests');
  }

  async updateModelRequestStatus(id: string, status: string): Promise<any> {
    return this.request(`/v1/admin/model-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Admin Allowlist
  async getAdmins(): Promise<any[]> {
    return this.request('/v1/admin/admins');
  }

  async addAdmin(email: string): Promise<any> {
    return this.request('/v1/admin/admins', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async removeAdmin(id: string): Promise<any> {
    return this.request(`/v1/admin/admins/${id}`, {
      method: 'DELETE',
    });
  }

  // Advertisement & Monetization
  async getAdSettings(): Promise<any> {
    return this.request('/v1/admin/ads/settings');
  }

  async updateAdSettings(data: any): Promise<any> {
    return this.request('/v1/admin/ads/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getCustomBanners(): Promise<any[]> {
    return this.request('/v1/admin/ads/banners');
  }

  async createCustomBanner(data: any): Promise<any> {
    return this.request('/v1/admin/ads/banners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomBanner(id: string, data: any): Promise<any> {
    return this.request(`/v1/admin/ads/banners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomBanner(id: string): Promise<any> {
    return this.request(`/v1/admin/ads/banners/${id}`, {
      method: 'DELETE',
    });
  }
}

export const adminApi = new AdminApiClient();

