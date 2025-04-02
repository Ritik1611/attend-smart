
import ApiService from './apiService';
import { getUserAttendanceRecords } from './attendanceDataService';

export interface AttendanceRecord {
  id: string;
  userId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'holiday' | 'pending';
}

export interface AttendanceStats {
  overallPercentage: number;
  presentCount: number;
  absentCount: number;
  totalClasses: number;
}

/**
 * Service for handling attendance-related API calls
 */
export const AttendanceApiService = {
  /**
   * Get all attendance records for a user
   */
  getUserAttendance: async (userId: string): Promise<AttendanceRecord[]> => {
    try {
      const response = await ApiService.get<AttendanceRecord[]>('/attendance', { userId });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        console.log("API returned unsuccessful response, falling back to Firestore");
        // Fallback to direct Firestore query if API fails
        return getUserAttendanceRecords(userId);
      }
    } catch (error) {
      console.error("API call failed, falling back to Firestore:", error);
      // Fallback to direct Firestore query if API fails
      return getUserAttendanceRecords(userId);
    }
  },
  
  /**
   * Mark attendance for a specific class and date
   */
  markAttendance: async (attendanceData: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> => {
    try {
      const response = await ApiService.post<AttendanceRecord>('/attendance', attendanceData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to mark attendance');
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      throw new Error(error instanceof Error ? error.message : 'Failed to mark attendance');
    }
  },
  
  /**
   * Update an existing attendance record
   */
  updateAttendance: async (id: string, data: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
    try {
      const response = await ApiService.put<AttendanceRecord>(`/attendance/${id}`, data);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update attendance');
      }
    } catch (error) {
      console.error("Error updating attendance:", error);
      throw new Error(error instanceof Error ? error.message : 'Failed to update attendance');
    }
  },
  
  /**
   * Get attendance statistics for a user
   */
  getAttendanceStats: async (userId: string): Promise<AttendanceStats> => {
    try {
      const response = await ApiService.get<AttendanceStats>('/attendance/stats', { userId });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch attendance statistics');
      }
    } catch (error) {
      console.error("Error fetching attendance statistics:", error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch attendance statistics');
    }
  }
};

export default AttendanceApiService;
