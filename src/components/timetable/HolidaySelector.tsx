
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

interface HolidaySelectorProps {
  selectedHolidays: string[];
  onChange: (holidays: string[]) => void;
}

const HolidaySelector: React.FC<HolidaySelectorProps> = ({
  selectedHolidays,
  onChange,
}) => {
  const days = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];

  const handleToggleDay = (day: string) => {
    if (selectedHolidays.includes(day)) {
      onChange(selectedHolidays.filter(d => d !== day));
    } else {
      onChange([...selectedHolidays, day]);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Select the days of the week that are holidays. No classes will be scheduled on these days.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {days.map((day) => (
              <div key={day.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`holiday-${day.value}`}
                  checked={selectedHolidays.includes(day.value)}
                  onCheckedChange={() => handleToggleDay(day.value)}
                />
                <Label htmlFor={`holiday-${day.value}`}>{day.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {selectedHolidays.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedHolidays.length} day{selectedHolidays.length !== 1 ? 's' : ''} marked as holiday.
        </div>
      )}
    </div>
  );
};

export default HolidaySelector;
