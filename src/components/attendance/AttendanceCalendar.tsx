
import React, { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DayContent } from "react-day-picker";
import { format } from "date-fns";
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from "@/contexts/AuthContext";

type AttendanceStatus = "present" | "absent" | "holiday" | "pending";

export type AttendanceDay = {
  date: Date;
  status: AttendanceStatus;
  classId?: string;
  className?: string;
};

type AttendanceCalendarProps = {
  attendanceData: AttendanceDay[];
  onSelectDate: (date: Date | undefined) => void;
};

const AttendanceCalendar = ({
  attendanceData: initialData,
  onSelectDate,
}: AttendanceCalendarProps) => {
  const { currentUser } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [attendanceData, setAttendanceData] = useState<AttendanceDay[]>(initialData);
  const [selectedDateClasses, setSelectedDateClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load attendance data from Firebase
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchAttendanceData = async () => {
      try {
        const attendanceQuery = query(
          collection(db, "attendance"),
          where("userId", "==", currentUser.uid)
        );
        
        const querySnapshot = await getDocs(attendanceQuery);
        const fetchedData: AttendanceDay[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.date) {
            fetchedData.push({
              date: new Date(data.date),
              status: data.status,
              classId: data.classId,
              className: data.className || data.classId
            });
          }
        });
        
        setAttendanceData(fetchedData);
        console.log("Fetched attendance data:", fetchedData);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      }
    };
    
    fetchAttendanceData();
  }, [currentUser]);

  const handleSelect = async (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    onSelectDate(selectedDate);
    
    if (selectedDate && currentUser) {
      setIsLoading(true);
      
      try {
        const dateString = format(selectedDate, "yyyy-MM-dd");
        const attendanceQuery = query(
          collection(db, "attendance"),
          where("userId", "==", currentUser.uid),
          where("date", "==", dateString)
        );
        
        const querySnapshot = await getDocs(attendanceQuery);
        const classes: any[] = [];
        
        querySnapshot.forEach((doc) => {
          classes.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setSelectedDateClasses(classes);
        console.log("Classes for selected date:", classes);
      } catch (error) {
        console.error("Error fetching classes for date:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSelectedDateClasses([]);
    }
  };

  const getDayStatus = (date: Date): AttendanceStatus | undefined => {
    const matchingDay = attendanceData.find(
      (day) =>
        day.date.getDate() === date.getDate() &&
        day.date.getMonth() === date.getMonth() &&
        day.date.getFullYear() === date.getFullYear()
    );
    return matchingDay?.status;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Attendance Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            className="rounded-md border-0"
            modifiersClassNames={{
              selected: "bg-primary text-primary-foreground",
            }}
            components={{
              DayContent: (props) => {
                const date = props.date;
                const status = getDayStatus(date);
                
                return (
                  <div
                    className={cn(
                      "h-9 w-9 text-sm rounded-full p-0 font-normal flex items-center justify-center",
                      {
                        "bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/40":
                          status === "present",
                        "bg-rose-100 text-rose-900 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/40":
                          status === "absent",
                        "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:hover:bg-slate-800/60":
                          status === "holiday",
                        "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/40":
                          status === "pending",
                      }
                    )}
                  >
                    {date.getDate()}
                  </div>
                );
              },
            }}
          />
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <span className="text-xs">Present</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-400"></div>
              <span className="text-xs">Absent</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-slate-400"></div>
              <span className="text-xs">Holiday</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <span className="text-xs">Pending</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {date && (
        <Card>
          <CardHeader>
            <CardTitle>Classes on {date && format(date, "MMMM d, yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : selectedDateClasses.length > 0 ? (
              <div className="space-y-2">
                {selectedDateClasses.map((cls) => (
                  <div key={cls.id} className="p-3 border rounded-md">
                    <div className="font-medium">{cls.className || cls.classId}</div>
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-sm text-muted-foreground">
                        {cls.startTime && cls.endTime ? `${cls.startTime} - ${cls.endTime}` : "No time specified"}
                      </div>
                      <div
                        className={cn("text-xs px-2 py-1 rounded-full", {
                          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400": cls.status === "present",
                          "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400": cls.status === "absent",
                          "bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-400": cls.status === "holiday",
                          "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400": cls.status === "pending",
                        })}
                      >
                        {cls.status.charAt(0).toUpperCase() + cls.status.slice(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No classes or attendance records found for this date
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceCalendar;
