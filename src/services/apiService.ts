
import { auth } from "../../firebaseConfig";

// Base URL for our custom API
const API_BASE_URL = "https://api.attendsmart.com/api"; // Update with your actual API endpoint

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
      
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`❌ API Error: GET ${endpoint} failed:`, error);
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
      console.log(`📤 API Request: POST ${API_BASE_URL}${endpoint}`, data);
      const startTime = performance.now();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      
      const endTime = performance.now();
      console.log(`📥 API Response: POST ${API_BASE_URL}${endpoint} - ${response.status} (${Math.round(endTime - startTime)}ms)`);
      
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`❌ API Error: POST ${endpoint} failed:`, error);
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
      console.log(`📤 API Request: PUT ${API_BASE_URL}${endpoint}`, data);
      const startTime = performance.now();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(data)
      });
      
      const endTime = performance.now();
      console.log(`📥 API Response: PUT ${API_BASE_URL}${endpoint} - ${response.status} (${Math.round(endTime - startTime)}ms)`);
      
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`❌ API Error: PUT ${endpoint} failed:`, error);
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
      console.log(`📤 API Request: DELETE ${API_BASE_URL}${endpoint}`);
      const startTime = performance.now();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders()
      });
      
      const endTime = performance.now();
      console.log(`📥 API Response: DELETE ${API_BASE_URL}${endpoint} - ${response.status} (${Math.round(endTime - startTime)}ms)`);
      
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error(`❌ API Error: DELETE ${endpoint} failed:`, error);
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
}

export default ApiService;
