
import { doc, getDoc, updateDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

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
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (!userDoc.exists()) {
      console.log(`⚠️ No user document found for: ${userId}, returning empty timetable`);
      return {
        timetable: getEmptyTimetable(),
        holidays: [],
      };
    }
    
    const userData = userDoc.data();
    console.log(`✅ Timetable fetched successfully for user: ${userId}`);
    
    return {
      timetable: userData.timetable || getEmptyTimetable(),
      holidays: userData.holidays || [],
    };
  } catch (error) {
    console.error("❌ Error fetching timetable:", error);
    throw error;
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
    await updateDoc(doc(db, "users", userId), updateData);
    console.log(`✅ Timetable updated successfully for user: ${userId}`);
  } catch (error) {
    console.error("❌ Error updating timetable:", error);
    
    // If document doesn't exist yet, create it
    try {
      await setDoc(doc(db, "users", userId), updateData);
      console.log(`✅ New timetable document created for user: ${userId}`);
    } catch (setError) {
      console.error("❌ Error creating timetable:", setError);
      throw setError;
    }
  }
};

export const getClassesForToday = async (userId: string): Promise<ClassItem[]> => {
  console.log(`🔄 Getting today's classes for user: ${userId}`);
  
  try {
    // Get the user's timetable
    const { timetable, holidays } = await fetchUserTimetable(userId);
    
    // Get today's day name in lowercase
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const dayKey = today as keyof Timetable;
    
    // Check if today is a holiday
    if (holidays.includes(today)) {
      console.log(`🏝️ Today is a holiday for user: ${userId}`);
      return [];
    }
    
    console.log(`✅ Today's classes fetched successfully for user: ${userId}`);
    // Return today's classes
    return timetable[dayKey] || [];
  } catch (error) {
    console.error("❌ Error getting today's classes:", error);
    throw error;
  }
};

// Subscribe to real-time timetable updates
export const subscribeTimetableChanges = (userId: string, callback: (data: {timetable: Timetable, holidays: string[]}) => void) => {
  console.log(`🔄 Setting up real-time timetable subscription for user: ${userId}`);
  
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
    const today = new Date().toISOString().split('T')[0];
    const attendanceId = `${userId}_${classItem.id}_${today}`;
    
    await setDoc(doc(db, "attendance", attendanceId), {
      userId,
      classId: classItem.id,
      className: classItem.name,
      date: today,
      status: isPresent ? 'present' : 'absent',
      timestamp: serverTimestamp()
    });
    
    console.log(`✅ Attendance logged successfully for user: ${userId}, class: ${classItem.name}`);
    return true;
  } catch (error) {
    console.error("❌ Error logging attendance:", error);
    return false;
  }
};
