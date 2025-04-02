
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import AttendanceCalendar from "@/components/attendance/AttendanceCalendar";
import ManualAttendanceForm from "@/components/attendance/ManualAttendanceForm";
import AttendanceList from "@/components/attendance/AttendanceList";

const AttendancePage = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <div className="flex justify-center items-center h-[80vh]">Please sign in to view your attendance</div>;
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Attendance Management</h1>
      
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
            onSelectDate={(date) => console.log("Selected date:", date)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendancePage;
