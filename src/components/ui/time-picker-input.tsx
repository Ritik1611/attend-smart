
import * as React from "react";
import { Input } from "@/components/ui/input";

interface TimePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TimePickerInput({ value, onChange, placeholder }: TimePickerInputProps) {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value;
    onChange(timeValue);
  };

  return (
    <Input
      type="time"
      value={value}
      onChange={handleTimeChange}
      placeholder={placeholder}
      className="w-full"
      required
    />
  );
}
