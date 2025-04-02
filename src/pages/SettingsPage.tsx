
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { saveNotificationSettings, getNotificationSettings } from "@/services/notificationService";
import SettingsForm from "@/components/settings/SettingsForm";
import { SubjectData } from "@/components/dashboard/SubjectAttendance";

const SettingsPage = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState({
    campusName: "City Engineering College",
    requiredAttendance: 75,
    notifications: {
      enabled: true,
      classReminders: true,
      attendanceWarnings: true,
      lowAttendanceThreshold: 75
    },
    locationTracking: true,
    subjectThresholds: {} as Record<string, number>,
  });
  const [subjects, setSubjects] = useState<{id: string, name: string, code: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!currentUser) return;
      
      try {
        const userId = currentUser.uid;
        
        // Get user document
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          setSettings(prevSettings => ({
            ...prevSettings,
            campusName: userData.campusLocation?.name || prevSettings.campusName,
            requiredAttendance: userData.requiredAttendance || prevSettings.requiredAttendance,
            locationTracking: userData.locationTracking !== undefined ? userData.locationTracking : prevSettings.locationTracking,
            subjectThresholds: userData.subjectThresholds || {},
          }));
        }
        
        // Get notification settings
        const notificationSettings = await getNotificationSettings(userId);
        setSettings(prevSettings => ({
          ...prevSettings,
          notifications: {
            enabled: notificationSettings.enabled,
            classReminders: notificationSettings.classReminders,
            attendanceWarnings: notificationSettings.attendanceWarnings,
            lowAttendanceThreshold: notificationSettings.lowAttendanceThreshold
          },
        }));

        // Fetch subjects
        await fetchSubjects(userId);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [currentUser]);

  const fetchSubjects = async (userId: string) => {
    try {
      // First try to get subjects from user's timetable
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists() && userDoc.data().timetable) {
        const timetable = userDoc.data().timetable;
        const uniqueSubjects = new Map();
        
        timetable.forEach((entry: any) => {
          if (entry.subject && !uniqueSubjects.has(entry.subject)) {
            uniqueSubjects.set(entry.subject, {
              id: entry.subject,
              name: entry.subjectName || entry.subject,
              code: entry.subjectCode || entry.subject
            });
          }
        });
        
        setSubjects(Array.from(uniqueSubjects.values()));
        return;
      }
      
      // If no timetable, try to get subjects from attendance records
      const attendanceQuery = collection(db, "attendance");
      const querySnapshot = await getDocs(attendanceQuery);
      
      const uniqueSubjects = new Map();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId === userId && data.subject && !uniqueSubjects.has(data.subject)) {
          uniqueSubjects.set(data.subject, {
            id: data.subject,
            name: data.subjectName || data.subject,
            code: data.subjectCode || data.subject
          });
        }
      });
      
      setSubjects(Array.from(uniqueSubjects.values()));
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const handleUpdateSettings = async (updatedSettings: any) => {
    if (!currentUser) {
      toast.error("You must be logged in to update settings");
      return;
    }
    
    try {
      const userId = currentUser.uid;
      
      // Save notification settings
      await saveNotificationSettings(userId, {
        enabled: settings.notifications.enabled,
        classReminders: settings.notifications.classReminders,
        attendanceWarnings: settings.notifications.attendanceWarnings,
        lowAttendanceThreshold: settings.notifications.lowAttendanceThreshold
      });
      
      // Save other settings
      await updateUserSettings(userId, {
        requiredAttendance: Number(updatedSettings.requiredAttendance),
        locationTracking: updatedSettings.locationTracking,
        subjectThresholds: updatedSettings.subjectThresholds || {},
      });
      
      // Update local state
      setSettings(prevSettings => ({
        ...prevSettings,
        requiredAttendance: Number(updatedSettings.requiredAttendance),
        locationTracking: updatedSettings.locationTracking,
        subjectThresholds: updatedSettings.subjectThresholds || {},
      }));
      
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    }
  };

  const updateUserSettings = async (userId: string, settingsData: any) => {
    try {
      const userRef = doc(db, "users", userId);
      
      // Get user document
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        throw new Error("User document does not exist");
      }
      
      // Update user settings
      await updateDoc(userRef, {
        ...settingsData,
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error("Error updating user settings:", error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <>
        <h1 className="section-heading">Settings</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="section-heading">Settings</h1>
      
      <SettingsForm 
        settings={{
          campusName: settings.campusName,
          requiredAttendance: settings.requiredAttendance,
          notifications: settings.notifications.enabled,
          locationTracking: settings.locationTracking,
          subjectThresholds: settings.subjectThresholds
        }}
        subjectsData={subjects}
        onUpdateSettings={handleUpdateSettings}
      />
    </>
  );
};

export default SettingsPage;
