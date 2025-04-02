
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import ApiService from "./apiService";

export interface ClassItem {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  location?: string;
}

export interface Timetable {
  monday: ClassItem[];
  tuesday: ClassItem[];
  wednesday: ClassItem[];
  thursday: ClassItem[];
  friday: ClassItem[];
  saturday: ClassItem[];
  sunday: ClassItem[];
}

// Initialize an empty timetable
export const getEmptyTimetable = (): Timetable => ({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
});

export const fetchUserTimetable = async (userId: string): Promise<{timetable: Timetable, holidays: string[]}> => {
  console.log(`🔄 Fetching timetable for user: ${userId}`);
  
  try {
    // First attempt to use API
    const response = await ApiService.get<{timetable: Timetable, holidays: string[]}>('/timetable', { userId });
    
    if (response.success && response.data) {
      console.log(`✅ Timetable fetched successfully via API for user: ${userId}`);
      return response.data;
    } else {
      console.log(`⚠️ API call failed, falling back to Firestore for user: ${userId}`);
      // Fallback to Firestore
      const userDoc = await getDoc(doc(db, "users", userId));
      
      if (!userDoc.exists()) {
        return {
          timetable: getEmptyTimetable(),
          holidays: [],
        };
      }
      
      const userData = userDoc.data();
      
      return {
        timetable: userData.timetable || getEmptyTimetable(),
        holidays: userData.holidays || [],
      };
    }
  } catch (error) {
    console.error("❌ Error fetching timetable:", error);
    
    // Final fallback
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      
      if (!userDoc.exists()) {
        return {
          timetable: getEmptyTimetable(),
          holidays: [],
        };
      }
      
      const userData = userDoc.data();
      
      return {
        timetable: userData.timetable || getEmptyTimetable(),
        holidays: userData.holidays || [],
      };
    } catch (fbError) {
      console.error("❌ Even Firestore fallback failed:", fbError);
      throw error; // Throw the original error if both methods fail
    }
  }
};

export const updateUserTimetable = async (userId: string, timetable: Timetable, holidays: string[]): Promise<void> => {
  console.log(`🔄 Updating timetable for user: ${userId}`);
  
  const updateData = {
    timetable,
    holidays,
    updatedAt: new Date().toISOString(),
  };
  
  try {
    // First attempt to use API
    const response = await ApiService.put('/timetable', { userId, ...updateData });
    
    if (response.success) {
      console.log(`✅ Timetable updated successfully via API for user: ${userId}`);
      return;
    } else {
      console.log(`⚠️ API call failed, falling back to Firestore for user: ${userId}`);
      // Fallback to Firestore
      await updateDoc(doc(db, "users", userId), updateData);
      console.log(`✅ Timetable updated successfully via Firestore for user: ${userId}`);
    }
  } catch (error) {
    console.error("❌ Error updating timetable:", error);
    
    // Final fallback
    try {
      await updateDoc(doc(db, "users", userId), updateData);
      console.log(`✅ Timetable updated successfully via Firestore fallback for user: ${userId}`);
    } catch (fbError) {
      console.error("❌ Even Firestore fallback failed:", fbError);
      throw error; // Throw the original error if both methods fail
    }
  }
};

export const getClassesForToday = async (userId: string): Promise<ClassItem[]> => {
  console.log(`🔄 Getting today's classes for user: ${userId}`);
  
  try {
    // First attempt to use API
    const response = await ApiService.get<ClassItem[]>('/timetable/today', { userId });
    
    if (response.success && response.data) {
      console.log(`✅ Today's classes fetched successfully via API for user: ${userId}`);
      return response.data;
    } else {
      console.log(`⚠️ API call failed, falling back to direct calculation for user: ${userId}`);
      // Fallback to direct calculation
      const { timetable, holidays } = await fetchUserTimetable(userId);
      
      // Get today's day name in lowercase
      const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      const dayKey = today as keyof Timetable;
      
      // Check if today is a holiday
      if (holidays.includes(today)) {
        return [];
      }
      
      // Return today's classes
      return timetable[dayKey] || [];
    }
  } catch (error) {
    console.error("❌ Error getting today's classes:", error);
    throw error;
  }
};

// Subscribe to real-time timetable updates
export const subscribeTimetableChanges = (userId: string, callback: (data: {timetable: Timetable, holidays: string[]}) => void) => {
  console.log(`🔄 Setting up real-time timetable subscription for user: ${userId}`);
  
  // This function currently uses Firestore's onSnapshot
  // In a production API environment, this would be replaced with WebSockets or similar
  const userDocRef = doc(db, "users", userId);
  
  const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
    console.log(`📡 Real-time update received for user: ${userId}`);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      callback({
        timetable: userData.timetable || getEmptyTimetable(),
        holidays: userData.holidays || []
      });
    } else {
      callback({
        timetable: getEmptyTimetable(),
        holidays: []
      });
    }
  }, (error) => {
    console.error("❌ Error subscribing to timetable changes:", error);
  });
  
  return unsubscribe;
};

// Check if a user should be marked present for a class based on location
export const checkAttendanceByLocation = (
  classItem: ClassItem, 
  userLocation: { lat: number, lng: number },
  locationName: string
): boolean => {
  console.log(`🔍 Checking attendance for class: ${classItem.name} at location: ${locationName}`);
  
  // This is a placeholder for actual location-based attendance logic
  // In a real implementation, you would:
  // 1. Check if the user's current location matches the class location
  // 2. Verify if the current time is within the class time range
  // 3. Mark attendance automatically if conditions are met
  
  if (!classItem.location) {
    const result = locationName === classItem.name || locationName.includes(classItem.code);
    console.log(`📍 Location match result (no class location specified): ${result}`);
    return result;
  }
  
  const result = classItem.location.toLowerCase() === locationName.toLowerCase() || 
         locationName.toLowerCase().includes(classItem.name.toLowerCase());
  
  console.log(`📍 Location match result: ${result}`);
  return result;
};

// Log attendance based on location
export const logAttendanceByLocation = async (
  userId: string,
  classItem: ClassItem,
  isPresent: boolean
): Promise<boolean> => {
  console.log(`🔄 Logging attendance for user: ${userId}, class: ${classItem.name}, present: ${isPresent}`);
  
  try {
    // First attempt to use API
    const response = await ApiService.post('/attendance/log', {
      userId,
      classId: classItem.id,
      className: classItem.name,
      date: new Date().toISOString(),
      status: isPresent ? 'present' : 'absent'
    });
    
    if (response.success) {
      console.log(`✅ Attendance logged successfully via API for user: ${userId}, class: ${classItem.name}`);
      return true;
    } else {
      console.log(`⚠️ API call failed for attendance logging, user: ${userId}, class: ${classItem.name}`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error logging attendance:", error);
    return false;
  }
};
