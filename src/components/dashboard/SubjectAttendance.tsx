
import React from "react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";

export type SubjectData = {
  id: string;
  name: string;
  code: string;
  attendancePercentage: number;
  classesConducted: number;
  classesAttended: number;
  requiredPercentage: number;
};

type SubjectAttendanceProps = {
  subjects: SubjectData[];
};

const SubjectAttendance = ({ subjects }: SubjectAttendanceProps) => {
  const { userSettings } = useAuth();
  
  const getStatusColor = (current: number, required: number) => {
    if (current >= required) return "bg-emerald-500";
    if (current >= required - 10) return "bg-amber-500";
    return "bg-rose-500";
  };

  // Apply subject-specific thresholds if available
  const subjectsWithThresholds = subjects.map(subject => {
    if (userSettings?.subjectThresholds && userSettings.subjectThresholds[subject.id]) {
      return {
        ...subject,
        requiredPercentage: userSettings.subjectThresholds[subject.id]
      };
    }
    return subject;
  });

  return (
    <div className="glass-card p-6 space-y-4 animated-entry">
      <h3 className="card-heading">Subject-wise Attendance</h3>
      
      <div className="space-y-5">
        {subjectsWithThresholds.map((subject) => (
          <div key={subject.id} className="space-y-2">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{subject.name}</p>
                <p className="text-xs text-muted-foreground">{subject.code}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{subject.attendancePercentage}%</p>
                <p className="text-xs text-muted-foreground">{subject.classesAttended}/{subject.classesConducted} classes</p>
              </div>
            </div>
            
            <div className="relative">
              <Progress 
                value={subject.attendancePercentage} 
                className={`h-2 rounded-full ${getStatusColor(subject.attendancePercentage, subject.requiredPercentage)}`}
              />
              <div 
                className="absolute top-0 bottom-0 w-px bg-black/30 dark:bg-white/30" 
                style={{ left: `${subject.requiredPercentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectAttendance;
