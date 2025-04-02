
import React from "react";
import { Check } from "lucide-react";

const tips = [
  "Arrive at least 5 minutes before class starts",
  "If you miss a class, contact your professor immediately",
  "Keep track of your attendance daily",
  "Set reminders for classes with lower attendance",
  "Check your attendance status weekly",
];

const AttendanceTips = () => {
  return (
    <div className="glass-card p-6 space-y-4 animated-entry">
      <h3 className="card-heading">Attendance Tips</h3>
      
      <ul className="space-y-3">
        {tips.map((tip, index) => (
          <li key={index} className="flex">
            <div className="mr-3 mt-0.5">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="w-3 h-3 text-primary" />
              </div>
            </div>
            <span className="text-sm">{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AttendanceTips;
