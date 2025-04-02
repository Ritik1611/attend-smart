
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export type AttendanceRecord = {
  id: string;
  userId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'holiday' | 'pending';
  timestamp: Timestamp;
};

export type SubjectAttendanceData = {
  id: string;
  name: string;
  code: string;
  attendancePercentage: number;
  classesConducted: number;
  classesAttended: number;
  requiredPercentage: number;
};

// Get all attendance records for a user
export const getUserAttendanceRecords = async (userId: string): Promise<AttendanceRecord[]> => {
  try {
    const attendanceQuery = query(
      collection(db, "attendance"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(attendanceQuery);
    const attendanceRecords: AttendanceRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      attendanceRecords.push({
        id: doc.id,
        userId: data.userId,
        classId: data.classId,
        date: data.date,
        status: data.status,
        timestamp: data.timestamp
      });
    });
    
    return attendanceRecords;
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return [];
  }
};

// Calculate attendance statistics for dashboard
export const calculateAttendanceStats = (records: AttendanceRecord[]) => {
  const totalRecords = records.length;
  const presentRecords = records.filter(record => record.status === 'present').length;
  
  return {
    attendancePercentage: totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0,
    requiredPercentage: 75, // Standard requirement
    daysPresent: presentRecords,
    totalDays: totalRecords,
    remainingDays: 20, // This would need to be calculated based on academic calendar
  };
};

// Calculate subject-wise attendance
export const calculateSubjectAttendance = (records: AttendanceRecord[]): SubjectAttendanceData[] => {
  // Group records by classId
  const subjectMap = new Map<string, {present: number, total: number}>();
  
  records.forEach(record => {
    if (!subjectMap.has(record.classId)) {
      subjectMap.set(record.classId, { present: 0, total: 0 });
    }
    
    const subjectData = subjectMap.get(record.classId)!;
    subjectData.total += 1;
    
    if (record.status === 'present') {
      subjectData.present += 1;
    }
  });
  
  // Convert map to array of subject data
  const subjectData: SubjectAttendanceData[] = Array.from(subjectMap.entries()).map(([classId, data]) => {
    const percentage = data.total > 0 ? (data.present / data.total) * 100 : 0;
    
    return {
      id: classId,
      name: classIdToSubjectName(classId),
      code: classId,
      attendancePercentage: percentage,
      classesConducted: data.total,
      classesAttended: data.present,
      requiredPercentage: 75
    };
  });
  
  return subjectData;
};

// Get weekly attendance data for charts
export const getWeeklyAttendanceData = (records: AttendanceRecord[]) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  // Initialize data for each day
  const weeklyData = days.map(day => ({
    name: day,
    present: 0,
    absent: 0,
    total: 0
  }));
  
  // Filter records from the last week and group by day
  records
    .filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= oneWeekAgo;
    })
    .forEach(record => {
      const recordDate = new Date(record.date);
      const dayIndex = recordDate.getDay() - 1; // 0 = Sunday, so Monday = 1, etc.
      
      if (dayIndex >= 0 && dayIndex < 5) { // Only weekdays
        weeklyData[dayIndex].total += 1;
        
        if (record.status === 'present') {
          weeklyData[dayIndex].present += 1;
        } else if (record.status === 'absent') {
          weeklyData[dayIndex].absent += 1;
        }
      }
    });
  
  return weeklyData;
};

// Get monthly attendance data for charts
export const getMonthlyAttendanceData = (records: AttendanceRecord[]) => {
  // Create a 4-week structure
  const monthlyData = [
    { name: 'Week 1', present: 0, absent: 0, total: 0 },
    { name: 'Week 2', present: 0, absent: 0, total: 0 },
    { name: 'Week 3', present: 0, absent: 0, total: 0 },
    { name: 'Week 4', present: 0, absent: 0, total: 0 }
  ];
  
  // Get records from the last 28 days
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 28);
  
  records
    .filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= oneMonthAgo;
    })
    .forEach(record => {
      const recordDate = new Date(record.date);
      const today = new Date();
      const daysDifference = Math.floor((today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Determine which week this record belongs to
      const weekIndex = Math.min(Math.floor(daysDifference / 7), 3);
      
      monthlyData[weekIndex].total += 1;
      
      if (record.status === 'present') {
        monthlyData[weekIndex].present += 1;
      } else if (record.status === 'absent') {
        monthlyData[weekIndex].absent += 1;
      }
    });
  
  return monthlyData;
};

// Get subject-wise data for the analytics tab
export const getSubjectAnalyticsData = (records: AttendanceRecord[]) => {
  const subjectMap = new Map<string, {present: number, absent: number}>();
  
  records.forEach(record => {
    if (!subjectMap.has(record.classId)) {
      subjectMap.set(record.classId, { present: 0, absent: 0 });
    }
    
    const subjectData = subjectMap.get(record.classId)!;
    
    if (record.status === 'present') {
      subjectData.present += 1;
    } else if (record.status === 'absent') {
      subjectData.absent += 1;
    }
  });
  
  return Array.from(subjectMap.entries()).map(([classId, data]) => {
    const total = data.present + data.absent;
    const percentage = total > 0 ? Math.round((data.present / total) * 100) : 0;
    
    return {
      name: classIdToSubjectName(classId),
      present: data.present,
      absent: data.absent,
      percentage
    };
  });
};

// Helper function to convert classId to subject name
const classIdToSubjectName = (classId: string): string => {
  // This would ideally come from a subjects collection in Firebase
  const subjectMapping: {[key: string]: string} = {
    "MATH101": "Mathematics",
    "CS202": "Computer Science",
    "PHY101": "Physics",
    "ENG101": "English",
    "CHEM101": "Chemistry"
  };
  
  return subjectMapping[classId] || classId;
};

// Get overall attendance percentage for pie chart
export const getAttendancePieData = (records: AttendanceRecord[]) => {
  const presentCount = records.filter(record => record.status === 'present').length;
  const totalCount = records.length;
  
  const presentPercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
  const absentPercentage = 100 - presentPercentage;
  
  return [
    { name: "Present", value: presentPercentage, color: "#16a34a" },
    { name: "Absent", value: absentPercentage, color: "#dc2626" }
  ];
};

// Get attendance data for the calendar view
export const getAttendanceCalendarData = (records: AttendanceRecord[]) => {
  return records.map(record => ({
    date: new Date(record.date),
    status: record.status
  }));
};
