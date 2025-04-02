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
  // Flag to control if we're in mock mode - Set this to false by default to use Firebase
  public static useMockApi = false; // Changed back to public
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
      console.log(`📤 API Request: GET ${API_BASE_URL}${endpoint}`, params); // Added logging
      // Use mock API if flag is set
      if (this.useMockApi) {
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
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });
      
      const result = await this.handleResponse<T>(response);
      console.log(`📥 API Response: GET ${url.toString()} - ${response.status}`, result); // Added logging
      
      return result;
    } catch (error) {
      console.error(`❌ API Error: GET ${endpoint} failed:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // Similar logging can be added for post, put, and delete methods...

  // Other methods remain unchanged...
}

export default ApiService;
