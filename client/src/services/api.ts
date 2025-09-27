import {
  CreateUserRequest,
  CreateUserResponse,
  CreateContractRequest,
  CreateContractResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  UpdateContractRequest,
  UpdateContractResponse,
  UpdateRecipientStatusRequest,
  UpdateRecipientStatusResponse,
  GetUserContractsResponse,
  GetReceivedContractsResponse,
  GetContractResponse,
  GetUserProfileResponse,
  UploadResponse,
  ApiError,
} from '../types';

const API_BASE_URL = 'http://localhost:3000';

class ApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));
        throw new Error(errorData.message || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // User endpoints
  async createUser(userData: CreateUserRequest): Promise<CreateUserResponse> {
    return this.makeRequest<CreateUserResponse>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserProfile(): Promise<GetUserProfileResponse> {
    return this.makeRequest<GetUserProfileResponse>('/users/profile');
  }

  async getUserByEmail(email: string): Promise<GetUserProfileResponse> {
    return this.makeRequest<GetUserProfileResponse>(`/users/by-email/${encodeURIComponent(email)}`);
  }

  async updateUser(userData: UpdateUserRequest): Promise<UpdateUserResponse> {
    return this.makeRequest<UpdateUserResponse>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  // Contract endpoints
  async createContract(contractData: CreateContractRequest): Promise<CreateContractResponse> {
    return this.makeRequest<CreateContractResponse>('/contracts', {
      method: 'POST',
      body: JSON.stringify(contractData),
    });
  }

  async getMyAllContracts(): Promise<GetUserContractsResponse> {
    return this.makeRequest<GetUserContractsResponse>('/contracts');
  }

  async getReceivedContracts(): Promise<GetReceivedContractsResponse> {
    return this.makeRequest<GetReceivedContractsResponse>('/contracts/received');
  }

  async getContract(contractAddress: string): Promise<GetContractResponse> {
    return this.makeRequest<GetContractResponse>(`/contracts/${contractAddress}`);
  }

  async updateContract(
    contractAddress: string,
    contractData: UpdateContractRequest
  ): Promise<UpdateContractResponse> {
    return this.makeRequest<UpdateContractResponse>(`/contracts/${contractAddress}`, {
      method: 'PATCH',
      body: JSON.stringify(contractData),
    });
  }

  async updateRecipientStatus(
    contractAddress: string,
    recipientAddress: string,
    statusData: UpdateRecipientStatusRequest
  ): Promise<UpdateRecipientStatusResponse> {
    return this.makeRequest<UpdateRecipientStatusResponse>(
      `/contracts/${contractAddress}/recipients/${recipientAddress}`,
      {
        method: 'PATCH',
        body: JSON.stringify(statusData),
      }
    );
  }

  // Upload endpoint
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.message || 'Upload failed');
    }

    return await response.json();
  }

  // Auth helpers
  setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  removeAuthToken(): void {
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const apiService = new ApiService();
export default apiService;
