
import { db } from '../../firebaseConfig';
import { doc, updateDoc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from "sonner";
import { scheduleNotifications } from './notificationService';
import { fetchUserTimetable } from './timetableService';

// Initialize attendance checking service
export const initAttendanceCheck = (userId: string) => {
  if (!userId) {
    console.error("Cannot initialize attendance check: No user ID provided");
    return;
  }
  
  console.log("Initializing attendance check for user:", userId);
  
  // Schedule notifications
  scheduleNotifications(userId);
  
  // Setup geolocation tracking
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (position) => checkAttendance(position, userId),
      (error) => console.error("Geolocation error:", error),
      { enableHighAccuracy: true }
    );
  } else {
    console.error("Geolocation is not supported by this browser");
  }
};

// Check if user is present at their campus location
export const checkAttendance = async (position: GeolocationPosition, userId: string) => {
  try {
    // Get user data including location settings
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      console.error("No user data found for attendance check");
      return;
    }
    
    const userData = userDoc.data();
    const campusLocation = userData.campusLocation;
    
    if (!campusLocation) {
      console.log("No campus location set");
      return;
    }
    
    // Update user's last check time and location status
    await updateDoc(doc(db, "users", userId), {
      lastLocationCheck: new Date().toISOString(),
    });
    
    // Calculate distance between user and campus
    const distance = calculateDistance(
      position.coords.latitude,
      position.coords.longitude,
      campusLocation.latitude,
      campusLocation.longitude
    );
    
    console.log(`Distance to campus: ${distance.toFixed(2)} meters`);
    
    // Check if user is within the campus radius
    const isPresent = distance <= (campusLocation.radius || 100);
    
    // Update user's attendance status
    await updateDoc(doc(db, "users", userId), {
      isOnCampus: isPresent
    });

    // Get current time to check against timetable
    const now = new Date();
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    console.log(`Current day: ${dayName}, Current time: ${currentTime}`);
    
    // Fetch the user's timetable
    const { timetable } = await fetchUserTimetable(userId);
    
    if (!timetable || !timetable[dayName]) {
      console.log("No timetable data for today");
      return isPresent;
    }

    // Find any classes happening now
    const currentClasses = timetable[dayName].filter((cls) => {
      return cls.startTime <= currentTime && cls.endTime >= currentTime;
    });
    
    console.log(`Found ${currentClasses.length} ongoing classes:`, currentClasses);
    
    // Record attendance if class is ongoing (regardless of presence status)
    if (currentClasses.length > 0) {
      console.log(`Recording attendance for ${currentClasses.length} classes with status: ${isPresent ? "present" : "absent"}`);
      
      for (const cls of currentClasses) {
        await recordAttendance(userId, cls, isPresent);
      }

      // Notify the user about attendance recording
      if (isPresent) {
        toast.success(`Attendance marked for ${currentClasses.length} ongoing class(es)`);
      } else {
        toast.error(`Marked absent for ${currentClasses.length} ongoing class(es)`);
      }
    } else {
      console.log("No ongoing classes found at this time");
    }
    
    return isPresent;
  } catch (error) {
    console.error("Error checking attendance:", error);
    return false;
  }
};

// Record a user's attendance for a specific class
const recordAttendance = async (userId: string, classData: any, isPresent: boolean) => {
  const today = new Date().toISOString().split('T')[0];
  const attendanceId = `${userId}_${classData.id}_${today}`;
  
  try {
    // Check if attendance is already recorded for today
    const attendanceDoc = await getDoc(doc(db, "attendance", attendanceId));
    
    if (!attendanceDoc.exists()) {
      // Record new attendance in the format matching your Firestore structure
      await setDoc(doc(db, "attendance", attendanceId), {
        userId: userId,
        classId: classData.id,
        className: classData.name,
        classCode: classData.code,
        date: today,
        status: isPresent ? "present" : "absent",
        timestamp: serverTimestamp()
      });
      
      console.log(`Attendance recorded: ${classData.name}, Status: ${isPresent ? "present" : "absent"}`);
      
      // Show notification to user
      if (isPresent) {
        toast.success(`Attendance marked for ${classData.name}`);
      } else {
        toast.error(`Marked absent for ${classData.name}`);
      }
    } else {
      // If attendance record already exists but user was previously marked absent
      // and is now present, update the record to present
      const existingData = attendanceDoc.data();
      
      if (existingData.status === "absent" && isPresent) {
        await updateDoc(doc(db, "attendance", attendanceId), {
          status: "present",
          updatedAt: new Date().toISOString()
        });
        
        console.log(`Updated attendance from absent to present for ${classData.name}`);
        toast.success(`Attendance updated to present for ${classData.name}`);
      }
    }
  } catch (error) {
    console.error("Error recording attendance:", error);
  }
};

// Mark attendance manually for past dates
export const markManualAttendance = async (userId: string, classId: string, date: string, status: string) => {
  const attendanceId = `${userId}_${classId}_${date}`;
  
  try {
    // Check if attendance already recorded for this date and class
    const attendanceDoc = await getDoc(doc(db, "attendance", attendanceId));
    
    if (attendanceDoc.exists()) {
      // Update existing attendance record
      await updateDoc(doc(db, "attendance", attendanceId), {
        status,
        updatedAt: new Date().toISOString(),
      });
      
      console.log(`Attendance updated for ${classId} on ${date}`);
    } else {
      // Create new attendance record
      await setDoc(doc(db, "attendance", attendanceId), {
        userId,
        classId,
        date,
        status,
        timestamp: serverTimestamp(),
        manuallyRecorded: true
      });
      
      console.log(`Manual attendance recorded for ${classId} on ${date}`);
    }
    
    return true;
  } catch (error) {
    console.error("Error recording manual attendance:", error);
    throw error;
  }
};

// Calculate distance between two points
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
           Math.cos(φ1) * Math.cos(φ2) *
           Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Save user's timetable to Firestore
export const saveTimetable = async (userId: string, timetable: any) => {
  try {
    console.log("Saving timetable for user:", userId);
    console.log("Timetable data:", timetable);
    
    await setDoc(doc(db, "users", userId), {
      timetable,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error("Error saving timetable:", error);
    throw error;
  }
};

// Save user's campus location to Firestore
export const saveCampusLocation = async (userId: string, location: any) => {
  try {
    await setDoc(doc(db, "users", userId), {
      campusLocation: location,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving campus location:", error);
    throw error;
  }
};

// Update user profile data
export const updateUserProfile = async (userId: string, profileData: any) => {
  try {
    await setDoc(doc(db, "users", userId), {
      ...profileData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};
