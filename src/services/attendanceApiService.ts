
import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
 * Service for handling attendance-related operations directly with Firebase
 */
export const AttendanceApiService = {
  /**
   * Get all attendance records for a user
   */
  getUserAttendance: async (userId: string): Promise<AttendanceRecord[]> => {
    try {
      console.log(`📤 Fetching attendance records for user: ${userId}`);
      return getUserAttendanceRecords(userId);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      throw error;
    }
  },
  
  /**
   * Mark attendance for a specific class and date
   */
  markAttendance: async (attendanceData: Omit<AttendanceRecord, 'id'>): Promise<AttendanceRecord> => {
    try {
      console.log(`📤 Marking attendance for user: ${attendanceData.userId}, class: ${attendanceData.classId}`);
      
      const attendanceId = `${attendanceData.userId}_${attendanceData.classId}_${attendanceData.date}`;
      
      await setDoc(doc(db, "attendance", attendanceId), {
        ...attendanceData,
        timestamp: serverTimestamp()
      });
      
      console.log(`✅ Attendance marked successfully: ${attendanceId}`);
      
      return {
        id: attendanceId,
        ...attendanceData
      };
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
      console.log(`📤 Updating attendance record: ${id}`);
      
      const attendanceRef = doc(db, "attendance", id);
      
      await updateDoc(attendanceRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`✅ Attendance record updated successfully: ${id}`);
      
      // Fetch the updated document to return
      const updatedDoc = await getDocs(query(collection(db, "attendance"), where("id", "==", id)));
      const updatedData = updatedDoc.docs[0]?.data() as AttendanceRecord;
      
      return {
        id,
        ...data,
        userId: updatedData?.userId || data.userId!,
        classId: updatedData?.classId || data.classId!,
        date: updatedData?.date || data.date!,
        status: updatedData?.status || data.status!
      };
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
      console.log(`📤 Fetching attendance statistics for user: ${userId}`);
      
      // Get all attendance records for the user
      const attendanceRecords = await getUserAttendanceRecords(userId);
      
      // Calculate statistics
      const totalClasses = attendanceRecords.length;
      const presentCount = attendanceRecords.filter(record => record.status === 'present').length;
      const absentCount = totalClasses - presentCount;
      const overallPercentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;
      
      console.log(`✅ Attendance statistics calculated for user: ${userId}`);
      
      return {
        overallPercentage,
        presentCount,
        absentCount,
        totalClasses
      };
    } catch (error) {
      console.error("Error fetching attendance statistics:", error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch attendance statistics');
    }
  }
};

export default AttendanceApiService;
