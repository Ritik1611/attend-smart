
import React from "react";
import { Progress } from "@/components/ui/progress";

type AttendanceOverviewProps = {
  attendancePercentage: number;
  requiredPercentage: number;
  daysPresent: number;
  totalDays: number;
  remainingDays: number;
};

const AttendanceOverview = ({
  attendancePercentage,
  requiredPercentage,
  daysPresent,
  totalDays,
  remainingDays,
}: AttendanceOverviewProps) => {
  const getStatusChip = () => {
    if (attendancePercentage >= requiredPercentage) {
      return <div className="chip-success">Good Standing</div>;
    } else if (attendancePercentage >= requiredPercentage - 10) {
      return <div className="chip-warning">Needs Attention</div>;
    } else {
      return <div className="chip-danger">Critical</div>;
    }
  };

  return (
    <div className="glass-card p-6 space-y-6 animated-entry">
      <div className="flex items-center justify-between">
        <h3 className="card-heading">Overall Attendance</h3>
        {getStatusChip()}
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between items-center text-sm">
          <span>Current: {attendancePercentage.toFixed(1)}%</span>
          <span className="text-muted-foreground">Target: {requiredPercentage}%</span>
        </div>
        <div className="relative">
          <Progress value={attendancePercentage} className="h-3 rounded-full" />
          <div 
            className="absolute top-0 bottom-0 w-px bg-amber-500 dark:bg-amber-400" 
            style={{ left: `${requiredPercentage}%` }}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="text-center">
          <p className="text-2xl font-medium">{daysPresent}</p>
          <p className="text-xs text-muted-foreground">Days Present</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-medium">{totalDays}</p>
          <p className="text-xs text-muted-foreground">Total Days</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-medium">{remainingDays}</p>
          <p className="text-xs text-muted-foreground">Remaining</p>
        </div>
      </div>
      
      {attendancePercentage < requiredPercentage && (
        <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg text-sm border border-amber-100 dark:border-amber-800/30">
          <span className="font-medium text-amber-800 dark:text-amber-300">Action needed:</span> 
          <span className="text-amber-700 dark:text-amber-400"> Attend at least {Math.ceil((requiredPercentage/100 * totalDays) - daysPresent)} more lectures to reach the required {requiredPercentage}% attendance.</span>
        </div>
      )}
    </div>
  );
};

export default AttendanceOverview;
