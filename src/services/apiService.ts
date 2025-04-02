
import { auth } from "../../firebaseConfig";
import MockApiService from "./mockApiService";

// Base URL for our custom API - Allow environment variable override or fallback to default
const DEFAULT_API_BASE_URL = "https://api.attendsmart.com/api"; 
const LOCAL_API_BASE_URL = "http://localhost:3001/api";

// Get the API base URL from environment or use default
const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? LOCAL_API_BASE_URL : DEFAULT_API_BASE_URL);

// Interface for API response
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Custom API service for handling REST API calls
 */
class ApiService {
  // Flag to control if we're in mock mode
  private static useMockApi = true;
  // Flag to control if we're showing verbose logging
  private static verboseLogging = true;
  
  /**
   * Helper method to get authentication headers
   */
  private static async getAuthHeaders(): Promise<HeadersInit> {
    const token = await auth.currentUser?.getIdToken();
    
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }
  
  /**
   * Perform a GET request
   */
  static async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      // Use mock API if flag is set
      if (this.useMockApi) {
        console.log(`📤 API Request (MOCK): GET ${endpoint}`, params);
        const mockResponse = await MockApiService.get<T>(endpoint, params);
        console.log(`📥 API Response (MOCK): GET ${endpoint}`, mockResponse);
        return mockResponse;
      }
      
      const url = new URL(`${API_BASE_URL}${endpoint}`);
      
      // Add query parameters if provided
      if (params) {
        Object.keys(params).forEach(key => 
          url.searchParams.append(key, params[key])
        );
      }
      
      console.log(`📤 API Request: GET ${url.toString()}`);
      const startTime = performance.now();
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });
      
      const endTime = performance.now();
      console.log(`📥 API Response: GET ${url.toString()} - ${response.status} (${Math.round(endTime - startTime)}ms)`);
      
      const result = await this.handleResponse<T>(response);
      
      if (this.verboseLogging) {
        console.log(`📦 API Response Data: GET ${url.toString()}`, result);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ API Error: GET ${endpoint} failed:`, error);
      
      // Fallback to mock API on failure if not already using it
      if (!this.useMockApi) {
        console.log(`⚠️ Falling back to mock API for GET ${endpoint}`);
        return MockApiService.get<T>(endpoint, params);
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Perform a POST request
   */
  static async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      // Use mock API if flag is set
      if (this.useMockApi) {
        console.log(`📤 API Request (MOCK): POST ${endpoint}`, data);
        const mockResponse = await MockApiService.post<T>(endpoint, data);
        console.log(`📥 API Response (MOCK): POST ${endpoint}`, mockResponse);
        return mockResponse;
      }
      
      console.log(`📤 API Request: POST ${API_BASE_URL}${endpoint}`, data);
      const startTime = performance.now();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      
      const endTime = performance.now();
      console.log(`📥 API Response: POST ${API_BASE_URL}${endpoint} - ${response.status} (${Math.round(endTime - startTime)}ms)`);
      
      const result = await this.handleResponse<T>(response);
      
      if (this.verboseLogging) {
        console.log(`📦 API Response Data: POST ${endpoint}`, result);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ API Error: POST ${endpoint} failed:`, error);
      
      // Fallback to mock API on failure if not already using it
      if (!this.useMockApi) {
        console.log(`⚠️ Falling back to mock API for POST ${endpoint}`);
        return MockApiService.post<T>(endpoint, data);
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Perform a PUT request
   */
  static async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      // Use mock API if flag is set
      if (this.useMockApi) {
        console.log(`📤 API Request (MOCK): PUT ${endpoint}`, data);
        const mockResponse = await MockApiService.put<T>(endpoint, data);
        console.log(`📥 API Response (MOCK): PUT ${endpoint}`, mockResponse);
        return mockResponse;
      }
      
      console.log(`📤 API Request: PUT ${API_BASE_URL}${endpoint}`, data);
      const startTime = performance.now();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      
      const endTime = performance.now();
      console.log(`📥 API Response: PUT ${API_BASE_URL}${endpoint} - ${response.status} (${Math.round(endTime - startTime)}ms)`);
      
      const result = await this.handleResponse<T>(response);
      
      if (this.verboseLogging) {
        console.log(`📦 API Response Data: PUT ${endpoint}`, result);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ API Error: PUT ${endpoint} failed:`, error);
      
      // Fallback to mock API on failure if not already using it
      if (!this.useMockApi) {
        console.log(`⚠️ Falling back to mock API for PUT ${endpoint}`);
        return MockApiService.put<T>(endpoint, data);
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Perform a DELETE request
   */
  static async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      // Use mock API if flag is set
      if (this.useMockApi) {
        console.log(`📤 API Request (MOCK): DELETE ${endpoint}`);
        const mockResponse = await MockApiService.delete<T>(endpoint);
        console.log(`📥 API Response (MOCK): DELETE ${endpoint}`, mockResponse);
        return mockResponse;
      }
      
      console.log(`📤 API Request: DELETE ${API_BASE_URL}${endpoint}`);
      const startTime = performance.now();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders()
      });
      
      const endTime = performance.now();
      console.log(`📥 API Response: DELETE ${API_BASE_URL}${endpoint} - ${response.status} (${Math.round(endTime - startTime)}ms)`);
      
      const result = await this.handleResponse<T>(response);
      
      if (this.verboseLogging) {
        console.log(`📦 API Response Data: DELETE ${endpoint}`, result);
      }
      
      return result;
    } catch (error) {
      console.error(`❌ API Error: DELETE ${endpoint} failed:`, error);
      
      // Fallback to mock API on failure if not already using it
      if (!this.useMockApi) {
        console.log(`⚠️ Falling back to mock API for DELETE ${endpoint}`);
        return MockApiService.delete<T>(endpoint);
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Handle API response
   */
  private static async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: HTTP ${response.status} - ${errorText}`);
      return {
        success: false,
        error: errorText || `HTTP error! status: ${response.status}`
      };
    }
    
    try {
      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error("❌ API Error: Failed to parse JSON response", error);
      return {
        success: false,
        error: 'Failed to parse response as JSON'
      };
    }
  }
  
  /**
   * Enable or disable mock API mode
   */
  static setMockApiMode(useMock: boolean): void {
    this.useMockApi = useMock;
    console.log(`${useMock ? '🧪' : '🔌'} API Mode: ${useMock ? 'MOCK' : 'REAL'}`);
  }
  
  /**
   * Enable or disable verbose logging
   */
  static setVerboseLogging(verbose: boolean): void {
    this.verboseLogging = verbose;
    console.log(`🔊 Verbose Logging: ${verbose ? 'ENABLED' : 'DISABLED'}`);
  }
  
  /**
   * Get the current API base URL
   */
  static getApiBaseUrl(): string {
    return API_BASE_URL;
  }
}

export default ApiService;
