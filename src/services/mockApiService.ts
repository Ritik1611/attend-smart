
import { v4 as uuidv4 } from 'uuid';
import { AttendanceRecord, AttendanceStats } from './attendanceApiService';
import { ClassItem, Timetable, getEmptyTimetable } from './timetableService';

// Mock data store for simulating a database
const mockDatabase = {
  users: [
    {
      id: 'user123',
      name: 'Demo User',
      email: 'demo@example.com',
      timetable: generateMockTimetable(),
      holidays: ['2025-04-10', '2025-04-20'],
      campusLocation: {
        latitude: 51.507351,
        longitude: -0.127758,
        radius: 100,
        name: 'Example University'
      }
    }
  ],
  attendance: generateMockAttendance('user123'),
  classes: generateMockClasses()
};

// Mock API service implementation
const MockApiService = {
  /**
   * Simulates a GET request to the API
   */
  get: async <T>(endpoint: string, params?: Record<string, string>): Promise<{ success: boolean; data?: T; error?: string }> => {
    console.log(`Mock API GET: ${endpoint}`, params);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Handle different API endpoints
    if (endpoint === '/status') {
      return {
        success: true,
        data: { status: 'ok', message: 'Mock API is running' } as unknown as T
      };
    }
    
    if (endpoint === '/attendance' && params?.userId) {
      const userId = params.userId;
      const records = mockDatabase.attendance.filter(record => record.userId === userId);
      return {
        success: true,
        data: records as unknown as T
      };
    }
    
    if (endpoint === '/attendance/stats' && params?.userId) {
      const userId = params.userId;
      const records = mockDatabase.attendance.filter(record => record.userId === userId);
      
      const stats: AttendanceStats = {
        presentCount: records.filter(r => r.status === 'present').length,
        absentCount: records.filter(r => r.status === 'absent').length,
        totalClasses: records.length,
        overallPercentage: 0
      };
      
      // Calculate percentage
      if (stats.totalClasses > 0) {
        stats.overallPercentage = (stats.presentCount / stats.totalClasses) * 100;
      }
      
      return {
        success: true,
        data: stats as unknown as T
      };
    }
    
    if (endpoint === '/timetable' && params?.userId) {
      const userId = params.userId;
      const user = mockDatabase.users.find(u => u.id === userId);
      
      if (user) {
        return {
          success: true,
          data: {
            timetable: user.timetable,
            holidays: user.holidays
          } as unknown as T
        };
      }
    }
    
    if (endpoint === '/timetable/today' && params?.userId) {
      const userId = params.userId;
      const user = mockDatabase.users.find(u => u.id === userId);
      
      if (user) {
        // Get today's day name in lowercase
        const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
        const dayKey = today as keyof Timetable;
        
        // Check if today is a holiday
        if (user.holidays?.includes(today)) {
          return {
            success: true,
            data: [] as unknown as T
          };
        }
        
        return {
          success: true,
          data: (user.timetable?.[dayKey] || []) as unknown as T
        };
      }
    }
    
    // Default response for unhandled endpoints
    return {
      success: false,
      error: `Mock API does not implement endpoint: ${endpoint}`
    };
  },
  
  /**
   * Simulates a POST request to the API
   */
  post: async <T>(endpoint: string, data: any): Promise<{ success: boolean; data?: T; error?: string }> => {
    console.log(`Mock API POST: ${endpoint}`, data);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (endpoint === '/attendance/log') {
      const { userId, classId, date, status } = data;
      
      const newRecord: AttendanceRecord = {
        id: uuidv4(),
        userId,
        classId,
        date,
        status
      };
      
      // Add to mock database
      mockDatabase.attendance.push(newRecord);
      
      return {
        success: true,
        data: newRecord as unknown as T
      };
    }
    
    if (endpoint === '/attendance') {
      const newRecord: AttendanceRecord = {
        id: uuidv4(),
        ...data
      };
      
      // Add to mock database
      mockDatabase.attendance.push(newRecord);
      
      return {
        success: true,
        data: newRecord as unknown as T
      };
    }
    
    // Default response for unhandled endpoints
    return {
      success: false,
      error: `Mock API does not implement POST endpoint: ${endpoint}`
    };
  },
  
  /**
   * Simulates a PUT request to the API
   */
  put: async <T>(endpoint: string, data: any): Promise<{ success: boolean; data?: T; error?: string }> => {
    console.log(`Mock API PUT: ${endpoint}`, data);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (endpoint.startsWith('/attendance/') && endpoint.length > 12) {
      const id = endpoint.substring(12);
      const index = mockDatabase.attendance.findIndex(record => record.id === id);
      
      if (index !== -1) {
        // Update record
        mockDatabase.attendance[index] = {
          ...mockDatabase.attendance[index],
          ...data
        };
        
        return {
          success: true,
          data: mockDatabase.attendance[index] as unknown as T
        };
      } else {
        return {
          success: false,
          error: `Record with id ${id} not found`
        };
      }
    }
    
    if (endpoint === '/timetable' && data.userId) {
      const { userId, timetable, holidays } = data;
      const userIndex = mockDatabase.users.findIndex(u => u.id === userId);
      
      if (userIndex !== -1) {
        // Update user timetable
        mockDatabase.users[userIndex].timetable = timetable;
        mockDatabase.users[userIndex].holidays = holidays;
        
        return {
          success: true,
          data: {
            timetable,
            holidays
          } as unknown as T
        };
      } else {
        return {
          success: false,
          error: `User with id ${userId} not found`
        };
      }
    }
    
    // Default response for unhandled endpoints
    return {
      success: false,
      error: `Mock API does not implement PUT endpoint: ${endpoint}`
    };
  },
  
  /**
   * Simulates a DELETE request to the API
   */
  delete: async <T>(endpoint: string): Promise<{ success: boolean; data?: T; error?: string }> => {
    console.log(`Mock API DELETE: ${endpoint}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (endpoint.startsWith('/attendance/') && endpoint.length > 12) {
      const id = endpoint.substring(12);
      const index = mockDatabase.attendance.findIndex(record => record.id === id);
      
      if (index !== -1) {
        // Remove record
        const deleted = mockDatabase.attendance.splice(index, 1)[0];
        
        return {
          success: true,
          data: deleted as unknown as T
        };
      } else {
        return {
          success: false,
          error: `Record with id ${id} not found`
        };
      }
    }
    
    // Default response for unhandled endpoints
    return {
      success: false,
      error: `Mock API does not implement DELETE endpoint: ${endpoint}`
    };
  }
};

// Helper function to generate mock attendance data
function generateMockAttendance(userId: string): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const classes = generateMockClasses();
  
  // Generate attendance for the past 30 days
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Add 1-3 classes per day
    const classCount = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < classCount && j < classes.length; j++) {
      const classItem = classes[j];
      const status = Math.random() > 0.2 ? 'present' : 'absent';
      
      records.push({
        id: uuidv4(),
        userId,
        classId: classItem.id,
        date: dateStr,
        status: status as 'present' | 'absent'
      });
    }
  }
  
  return records;
}

// Helper function to generate mock classes
function generateMockClasses(): ClassItem[] {
  return [
    {
      id: 'cs101',
      name: 'Introduction to Computer Science',
      code: 'CS101',
      startTime: '09:00',
      endTime: '10:30',
      location: 'Smith Building, Room 302'
    },
    {
      id: 'math201',
      name: 'Calculus II',
      code: 'MATH201',
      startTime: '11:00',
      endTime: '12:30',
      location: 'Science Center, Room 105'
    },
    {
      id: 'eng120',
      name: 'Academic Writing',
      code: 'ENG120',
      startTime: '14:00',
      endTime: '15:30',
      location: 'Arts Building, Room 210'
    },
    {
      id: 'phys150',
      name: 'Physics I',
      code: 'PHYS150',
      startTime: '16:00',
      endTime: '17:30',
      location: 'Science Center, Room 201'
    }
  ];
}

// Helper function to generate a mock timetable
function generateMockTimetable(): Timetable {
  const timetable = getEmptyTimetable();
  const classes = generateMockClasses();
  
  // Monday
  timetable.monday = [
    classes[0],
    classes[1]
  ];
  
  // Tuesday
  timetable.tuesday = [
    classes[2]
  ];
  
  // Wednesday
  timetable.wednesday = [
    classes[0],
    classes[3]
  ];
  
  // Thursday
  timetable.thursday = [
    classes[1],
    classes[2]
  ];
  
  // Friday
  timetable.friday = [
    classes[3]
  ];
  
  return timetable;
}

export default MockApiService;
