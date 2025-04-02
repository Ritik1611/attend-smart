
import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import AttendanceCalendar from "@/components/attendance/AttendanceCalendar";
import ManualAttendanceForm from "@/components/attendance/ManualAttendanceForm";
import AttendanceList from "@/components/attendance/AttendanceList";
import { initAttendanceCheck } from "@/services/attendanceService";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const AttendancePage = () => {
  const { currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [locationStatus, setLocationStatus] = useState<string>("checking");

  useEffect(() => {
    if (currentUser) {
      // Initialize automated attendance tracking
      initAttendanceCheck(currentUser.uid);
      
      // Check if location services are enabled
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log("Location access granted:", position.coords);
            setLocationStatus("enabled");
            
            // Trigger an immediate attendance check
            import('@/services/attendanceService').then(({ checkAttendance }) => {
              if (typeof checkAttendance === 'function') {
                checkAttendance(position, currentUser.uid)
                  .then(isPresent => {
                    console.log("Initial attendance check complete, present:", isPresent);
                  })
                  .catch(err => {
                    console.error("Error in initial attendance check:", err);
                  });
              }
            });
          },
          (error) => {
            console.error("Location error:", error);
            setLocationStatus("disabled");
            toast.error("Location access is required for automated attendance");
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      } else {
        setLocationStatus("unsupported");
        toast.error("Your browser doesn't support geolocation");
      }
    }
  }, [currentUser]);

  if (!currentUser) {
    return <div className="flex justify-center items-center h-[80vh]">Please sign in to view your attendance</div>;
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Attendance Management</h1>
      
      {locationStatus === "disabled" && (
        <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-amber-800 dark:text-amber-400">
              <MapPin className="h-5 w-5 mr-2" />
              Location Services Disabled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Please enable location services in your browser to allow automatic attendance tracking.
              Your attendance will still be saved manually, but automated tracking requires location access.
            </CardDescription>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="records" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <AttendanceList userId={currentUser.uid} />
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <ManualAttendanceForm userId={currentUser.uid} />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <AttendanceCalendar 
            attendanceData={[]}
            onSelectDate={(date) => setSelectedDate(date)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendancePage;
