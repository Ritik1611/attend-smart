
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AttendanceOverview from "@/components/dashboard/AttendanceOverview";
import AttendanceTips from "@/components/dashboard/AttendanceTips";
import LocationCard from "@/components/dashboard/LocationCard";
import SubjectAttendance from "@/components/dashboard/SubjectAttendance";
import AttendanceAnalytics from "@/components/dashboard/AttendanceAnalytics";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { 
  getUserAttendanceRecords, 
  calculateAttendanceStats, 
  calculateSubjectAttendance,
  AttendanceRecord 
} from "@/services/attendanceDataService";
import { initAttendanceCheck } from "@/services/attendanceService";

const Index = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState({
    attendancePercentage: 0,
    requiredPercentage: 75,
    daysPresent: 0,
    totalDays: 0,
    remainingDays: 20
  });
  const [subjects, setSubjects] = useState([]);
  const [campusName, setCampusName] = useState("");
  const [lastChecked, setLastChecked] = useState("Not checked yet");
  const [isOnCampus, setIsOnCampus] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [hasSetupLocation, setHasSetupLocation] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    if (!currentUser) {
      const localUser = localStorage.getItem("user");
      if (!localUser) {
        navigate("/auth");
        return;
      }
    }

    const checkUserSetup = async () => {
      try {
        // Get user ID from Firebase Auth or localStorage
        const userId = currentUser?.uid || JSON.parse(localStorage.getItem("user") || "{}").id;
        
        if (!userId) {
          console.error("No user ID found");
          navigate("/auth");
          return;
        }

        const userDoc = await getDoc(doc(db, "users", userId));
        
        // If user document doesn't exist or doesn't have timetable, redirect to setup
        if (!userDoc.exists()) {
          navigate("/setup/timetable");
          return;
        }
        
        if (!userDoc.data().timetable) {
          navigate("/setup/timetable");
          return;
        }
        
        // Check if user has campus location set up
        if (!userDoc.data().campusLocation) {
          setHasSetupLocation(false);
          // Only redirect if the check explicitly determines no location is set
          navigate("/setup/location");
          return;
        }
        
        // Get campus location name
        if (userDoc.data().campusLocation) {
          setCampusName(userDoc.data().campusLocation.name);
          setHasSetupLocation(true);
        }
        
        // Get last checked time
        if (userDoc.data().lastLocationCheck) {
          const lastCheckDate = new Date(userDoc.data().lastLocationCheck);
          setLastChecked(lastCheckDate.toLocaleString());
          
          // If last check was within the last hour, use the isOnCampus value
          const oneHourAgo = new Date();
          oneHourAgo.setHours(oneHourAgo.getHours() - 1);
          
          if (lastCheckDate > oneHourAgo && userDoc.data().isOnCampus !== undefined) {
            setIsOnCampus(userDoc.data().isOnCampus);
          }
        }
        
        // Fetch attendance records
        const records = await getUserAttendanceRecords(userId);
        setAttendanceRecords(records);
        
        // Calculate attendance stats
        const stats = calculateAttendanceStats(records);
        setAttendanceData(stats);
        
        // Calculate subject-wise attendance
        const subjectData = calculateSubjectAttendance(records);
        setSubjects(subjectData);
        
        // Initialize attendance checking
        initAttendanceCheck(userId);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking user setup:", error);
        setIsLoading(false);
      }
    };

    checkUserSetup();
  }, [currentUser, navigate]);

  const handleCheckLocation = () => {
    navigate("/location");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <h1 className="section-heading">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <AttendanceOverview {...attendanceData} />
        </div>
        <LocationCard 
          isOnCampus={isOnCampus}
          campusName={campusName}
          lastCheckedTime={lastChecked}
          onCheckLocation={handleCheckLocation}
        />
      </div>
      
      <div className="mb-6">
        <AttendanceAnalytics />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubjectAttendance subjects={subjects} />
        <AttendanceTips />
      </div>
    </>
  );
};

export default Index;
