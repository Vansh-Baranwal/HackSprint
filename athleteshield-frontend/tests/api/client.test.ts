import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock axios before importing apiClient
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

describe('API Client', () => {
  let mockAxiosInstance: any;

  beforeEach(async () => {
    // Get the mocked axios
    const mockedAxios = (await import('axios')).default as any;
    
    // Create a mock axios instance
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
    };

    mockedAxios.create = vi.fn(() => mockAxiosInstance);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('HTTP Methods', () => {
    it('creates axios instance with correct config', async () => {
      // Import apiClient after mocking
      const { apiClient } = await import('@/lib/api/client');
      const mockedAxios = (await import('axios')).default as any;
      
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: expect.any(String),
          timeout: 30000,
          withCredentials: true,
        })
      );
    });

    it('sets up request and response interceptors', async () => {
      const { apiClient } = await import('@/lib/api/client');
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });

    it('makes GET request and returns data', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockAxiosInstance.get.mockResolvedValue({
        data: { data: mockData },
      });

      const { apiClient } = await import('@/lib/api/client');
      const result = await apiClient.get('/test');
      expect(result).toEqual(mockData);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
    });

    it('makes POST request and returns data', async () => {
      const mockData = { id: 1, name: 'Test' };
      const postData = { name: 'Test' };
      mockAxiosInstance.post.mockResolvedValue({
        data: { data: mockData },
      });

      const { apiClient } = await import('@/lib/api/client');
      const result = await apiClient.post('/test', postData);
      expect(result).toEqual(mockData);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', postData, undefined);
    });

    it('makes PUT request and returns data', async () => {
      const mockData = { id: 1, name: 'Updated' };
      const putData = { name: 'Updated' };
      mockAxiosInstance.put.mockResolvedValue({
        data: { data: mockData },
      });

      const { apiClient } = await import('@/lib/api/client');
      const result = await apiClient.put('/test/1', putData);
      expect(result).toEqual(mockData);
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', putData, undefined);
    });

    it('makes PATCH request and returns data', async () => {
      const mockData = { id: 1, name: 'Patched' };
      const patchData = { name: 'Patched' };
      mockAxiosInstance.patch.mockResolvedValue({
        data: { data: mockData },
      });

      const { apiClient } = await import('@/lib/api/client');
      const result = await apiClient.patch('/test/1', patchData);
      expect(result).toEqual(mockData);
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test/1', patchData, undefined);
    });

    it('makes DELETE request and returns data', async () => {
      const mockData = { success: true };
      mockAxiosInstance.delete.mockResolvedValue({
        data: { data: mockData },
      });

      const { apiClient } = await import('@/lib/api/client');
      const result = await apiClient.delete('/test/1');
      expect(result).toEqual(mockData);
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1', undefined);
    });
  });

  describe('File Upload', () => {
    it('uploads file with progress tracking', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const mockData = { id: 1, filename: 'test.pdf' };
      const onProgress = vi.fn();

      mockAxiosInstance.post.mockResolvedValue({
        data: { data: mockData },
      });

      const { apiClient } = await import('@/lib/api/client');
      const result = await apiClient.uploadFile('/upload', mockFile, onProgress);
      
      expect(result).toEqual(mockData);
      expect(mockAxiosInstance.post).toHaveBeenCalled();
      
      // Check that FormData was used
      const callArgs = mockAxiosInstance.post.mock.calls[0];
      expect(callArgs[1]).toBeInstanceOf(FormData);
    });
  });
});
