
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { getUserAttendanceRecords, calculateAttendanceStats } from "@/services/attendanceDataService";
import EditProfileForm from "@/components/profile/EditProfileForm";

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState({
    name: "",
    studentId: "",
    email: "",
    department: "Computer Science",
    batch: "2023-2027",
    semester: "3rd Semester",
    overallAttendance: "0%",
  });
  const [attendanceStats, setAttendanceStats] = useState({
    overallAttendance: "0%",
    presentDays: 0,
    absentDays: 0,
    requiredAttendance: "75%"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user ID from Firebase Auth or localStorage
        const userId = currentUser?.uid || JSON.parse(localStorage.getItem("user") || "{}").id;
        
        if (!userId) {
          console.error("No user ID found");
          return;
        }
        
        // Fetch user data
        const userDoc = await getDoc(doc(db, "users", userId));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            name: data.name || "User",
            studentId: data.studentId || "Student ID",
            email: currentUser?.email || data.email || "user@example.com",
            department: data.department || "Computer Science",
            batch: data.batch || "2023-2027",
            semester: data.semester || "3rd Semester",
            overallAttendance: "0%", // Will be updated from attendance records
          });
        }
        
        // Fetch attendance records
        const records = await getUserAttendanceRecords(userId);
        const stats = calculateAttendanceStats(records);
        
        // Update attendance stats
        setAttendanceStats({
          overallAttendance: `${stats.attendancePercentage.toFixed(1)}%`,
          presentDays: stats.daysPresent,
          absentDays: stats.totalDays - stats.daysPresent,
          requiredAttendance: `${stats.requiredPercentage}%`
        });
        
        // Update overall attendance in userData
        setUserData(prev => ({
          ...prev,
          overallAttendance: `${stats.attendancePercentage.toFixed(1)}%`
        }));
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [currentUser]);

  // Generate initials from name for Avatar fallback
  const getInitials = () => {
    return userData.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <>
        <h1 className="section-heading">Profile</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="section-heading">Profile</h1>
      
      <div className="space-y-6">
        <div className="glass-card p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 animated-entry">
          <Avatar className="w-24 h-24">
            <AvatarImage src="" alt={userData.name} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{getInitials()}</AvatarFallback>
          </Avatar>
          
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-semibold">{userData.name}</h2>
            <p className="text-muted-foreground">{userData.studentId}</p>
            <p className="mt-2">{userData.email}</p>
            
            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
              <div className="chip-primary">{userData.department}</div>
              <div className="chip bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400">{userData.semester}</div>
              <div className="chip-success">{userData.overallAttendance} Attendance</div>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="edit">Edit Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="animated-entry">
                <CardHeader>
                  <CardTitle className="text-lg">Academic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div className="flex justify-between">
                      <dt className="text-sm text-muted-foreground">Department</dt>
                      <dd className="font-medium">{userData.department}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-muted-foreground">Batch</dt>
                      <dd className="font-medium">{userData.batch}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-muted-foreground">Semester</dt>
                      <dd className="font-medium">{userData.semester}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-muted-foreground">Student ID</dt>
                      <dd className="font-medium">{userData.studentId}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              
              <Card className="animated-entry">
                <CardHeader>
                  <CardTitle className="text-lg">Attendance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-4">
                    <div className="flex justify-between">
                      <dt className="text-sm text-muted-foreground">Overall Attendance</dt>
                      <dd className="font-medium">{attendanceStats.overallAttendance}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-muted-foreground">Present Days</dt>
                      <dd className="font-medium">{attendanceStats.presentDays}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-muted-foreground">Absent Days</dt>
                      <dd className="font-medium">{attendanceStats.absentDays}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-muted-foreground">Required Attendance</dt>
                      <dd className="font-medium">{attendanceStats.requiredAttendance}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="edit">
            <EditProfileForm />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default ProfilePage;
