
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { toast } from "sonner";
import { calculateSubjectAttendance, AttendanceRecord } from './attendanceDataService';

// Interface for notification settings
export interface NotificationSettings {
  enabled: boolean;
  classReminders: boolean;
  attendanceWarnings: boolean;
  lowAttendanceThreshold: number;
}

// Schedule notifications for the day
export const scheduleNotifications = async (userId: string) => {
  try {
    // Get user data including notification preferences and timetable
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (!userDoc.exists()) {
      console.log("No user document found for notifications");
      return;
    }
    
    const userData = userDoc.data();
    
    // Check if notifications are enabled
    const notificationSettings = userData.notificationSettings || {
      enabled: true,
      classReminders: true,
      attendanceWarnings: true,
      lowAttendanceThreshold: 75
    };
    
    if (!notificationSettings.enabled) {
      console.log("Notifications are disabled for this user");
      return;
    }
    
    const timetable = userData.timetable || [];
    
    // Get today's classes
    const today = new Date();
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][today.getDay()];
    
    const todaysClasses = timetable.filter((cls: any) => cls.day === dayOfWeek);
    
    // Schedule class reminders
    if (notificationSettings.classReminders && todaysClasses.length > 0) {
      for (const cls of todaysClasses) {
        scheduleClassReminder(cls, userId);
      }
    }
    
    // Check for attendance warnings
    if (notificationSettings.attendanceWarnings) {
      checkAttendanceWarnings(userId, notificationSettings.lowAttendanceThreshold);
    }
    
    return true;
  } catch (error) {
    console.error("Error scheduling notifications:", error);
    return false;
  }
};

// Schedule a reminder for an upcoming class
const scheduleClassReminder = (classData: any, userId: string) => {
  try {
    const [hours, minutes] = classData.startTime.split(':').map(Number);
    
    // Create Date object for class time today
    const classTime = new Date();
    classTime.setHours(hours, minutes, 0, 0);
    
    // Calculate time for reminder (5 minutes before class)
    const reminderTime = new Date(classTime.getTime() - 5 * 60 * 1000);
    
    // Get current time
    const now = new Date();
    
    // If reminder time is in the future, schedule it
    if (reminderTime > now) {
      const timeUntilReminder = reminderTime.getTime() - now.getTime();
      
      setTimeout(() => {
        sendClassReminder(classData, userId);
      }, timeUntilReminder);
      
      console.log(`Scheduled reminder for ${classData.subject} at ${reminderTime.toLocaleTimeString()}`);
    }
  } catch (error) {
    console.error("Error scheduling class reminder:", error);
  }
};

// Send a reminder for an upcoming class
const sendClassReminder = (classData: any, userId: string) => {
  try {
    // For web app, we'll use toast notifications
    toast.info(`Class reminder: ${classData.subjectName || classData.subject} starts in 5 minutes!`, {
      duration: 10000,
    });
    
    // In a real app, you might use push notifications or other methods
    console.log(`Sending reminder for class ${classData.subject}`);
    
    // Record that this notification was sent
    saveNotification(userId, {
      type: 'class-reminder',
      subject: classData.subject,
      message: `${classData.subjectName || classData.subject} starts in 5 minutes!`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error sending class reminder:", error);
  }
};

// Check attendance levels and send warnings if needed
const checkAttendanceWarnings = async (userId: string, threshold = 75) => {
  try {
    // Get attendance records
    const attendanceQuery = query(
      collection(db, "attendance"),
      where("userId", "==", userId)
    );
    
    const querySnapshot = await getDocs(attendanceQuery);
    const attendanceRecords: AttendanceRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      attendanceRecords.push(doc.data() as AttendanceRecord);
    });
    
    // Calculate subject-wise attendance
    const subjectData = calculateSubjectAttendance(attendanceRecords);
    
    // Check for subjects below threshold
    const lowAttendanceSubjects = subjectData.filter(subject => 
      subject.attendancePercentage < threshold
    );
    
    // Send warnings for subjects with low attendance
    if (lowAttendanceSubjects.length > 0) {
      for (const subject of lowAttendanceSubjects) {
        sendAttendanceWarning(subject, userId);
      }
    }
  } catch (error) {
    console.error("Error checking attendance warnings:", error);
  }
};

// Send a warning for low attendance
const sendAttendanceWarning = (subjectData: any, userId: string) => {
  try {
    const message = `Warning: Your attendance in ${subjectData.name} is only ${subjectData.attendancePercentage.toFixed(1)}%, below the required ${subjectData.requiredPercentage}%`;
    
    // For web app, we'll use toast notifications
    toast.warning(message, {
      duration: 10000,
    });
    
    // Record that this notification was sent
    saveNotification(userId, {
      type: 'attendance-warning',
      subject: subjectData.id,
      message,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error sending attendance warning:", error);
  }
};

// Save notification to Firestore
const saveNotification = async (userId: string, notificationData: any) => {
  try {
    const notificationId = `${userId}_${notificationData.type}_${Date.now()}`;
    
    await setDoc(doc(db, "notifications", notificationId), {
      userId,
      ...notificationData
    });
    
    console.log("Notification saved to Firestore");
  } catch (error) {
    console.error("Error saving notification:", error);
  }
};

// Save or update notification settings
export const saveNotificationSettings = async (userId: string, settings: NotificationSettings) => {
  try {
    await updateDoc(doc(db, "users", userId), {
      notificationSettings: settings
    });
    
    return true;
  } catch (error) {
    console.error("Error saving notification settings:", error);
    return false;
  }
};

// Get user's notification settings
export const getNotificationSettings = async (userId: string): Promise<NotificationSettings> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    
    if (userDoc.exists() && userDoc.data().notificationSettings) {
      return userDoc.data().notificationSettings;
    }
    
    // Default settings
    return {
      enabled: true,
      classReminders: true,
      attendanceWarnings: true,
      lowAttendanceThreshold: 75
    };
  } catch (error) {
    console.error("Error getting notification settings:", error);
    
    // Return default settings on error
    return {
      enabled: true,
      classReminders: true,
      attendanceWarnings: true,
      lowAttendanceThreshold: 75
    };
  }
};
