
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimePickerInput } from "@/components/ui/time-picker-input";
import { ClassItem } from "@/services/timetableService";
import { toast } from "sonner";

type TimetableFormProps = {
  onAddClass: (day: string, newClass: ClassItem) => void;
  classToEdit?: {
    day: string;
    index: number;
    class: ClassItem;
  };
  onUpdate?: () => void;
};

const TimetableForm: React.FC<TimetableFormProps> = ({ onAddClass, classToEdit, onUpdate }) => {
  const [selectedDay, setSelectedDay] = useState(classToEdit ? classToEdit.day : "monday");
  const [className, setClassName] = useState(classToEdit ? classToEdit.class.name : "");
  const [classCode, setClassCode] = useState(classToEdit ? classToEdit.class.code : "");
  const [startTime, setStartTime] = useState<string>(classToEdit ? classToEdit.class.startTime : "09:00");
  const [endTime, setEndTime] = useState<string>(classToEdit ? classToEdit.class.endTime : "10:00");
  const [location, setLocation] = useState(classToEdit ? classToEdit.class.location : "");

  const days = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!className || !classCode || !startTime || !endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newClass: ClassItem = {
      id: classToEdit ? classToEdit.class.id : `class-${Date.now()}`,
      name: className,
      code: classCode,
      startTime,
      endTime,
      location,
    };

    if (classToEdit && onUpdate) {
      onAddClass(classToEdit.day, newClass);
      onUpdate();
      toast.success(`Class "${className}" updated successfully`);
    } else {
      onAddClass(selectedDay, newClass);
      // Reset form after adding
      toast.success(`Class "${className}" added to ${days.find(d => d.value === selectedDay)?.label}`);
      setClassName("");
      setClassCode("");
      setStartTime("09:00");
      setEndTime("10:00");
      setLocation("");
    }
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="day">Day of Week</Label>
        <Select
          value={selectedDay}
          onValueChange={setSelectedDay}
          disabled={!!classToEdit}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select day" />
          </SelectTrigger>
          <SelectContent>
            {days.map((day) => (
              <SelectItem key={day.value} value={day.value}>
                {day.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="className">Class Name</Label>
          <Input
            id="className"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g. Mathematics"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="classCode">Class Code</Label>
          <Input
            id="classCode"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            placeholder="e.g. MATH101"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <TimePickerInput 
            value={startTime}
            onChange={handleStartTimeChange}
            placeholder="09:00 AM"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <TimePickerInput 
            value={endTime}
            onChange={handleEndTimeChange}
            placeholder="10:00 AM"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="location">Location (Optional)</Label>
        <p className="text-xs text-muted-foreground mb-1">
          Class location will be automatically detected during attendance.
        </p>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Room 101"
        />
      </div>
      
      <Button type="submit" className="w-full">
        {classToEdit ? "Update Class" : "Add Class"}
      </Button>
    </form>
  );
};

export default TimetableForm;
