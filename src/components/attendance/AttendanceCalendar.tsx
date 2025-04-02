
import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { DayContent } from "react-day-picker";

type AttendanceStatus = "present" | "absent" | "holiday" | "pending";

export type AttendanceDay = {
  date: Date;
  status: AttendanceStatus;
};

type AttendanceCalendarProps = {
  attendanceData: AttendanceDay[];
  onSelectDate: (date: Date | undefined) => void;
};

const AttendanceCalendar = ({
  attendanceData,
  onSelectDate,
}: AttendanceCalendarProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleSelect = (date: Date | undefined) => {
    setDate(date);
    onSelectDate(date);
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
    <div className="glass-card p-6 space-y-4 animated-entry">
      <h3 className="card-heading">Attendance Calendar</h3>
      
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
      
      <div className="grid grid-cols-2 gap-2">
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
    </div>
  );
};

export default AttendanceCalendar;
