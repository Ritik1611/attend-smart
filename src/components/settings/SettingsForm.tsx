
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type SettingsProps = {
  settings: {
    campusName: string;
    requiredAttendance: number;
    notifications: boolean;
    locationTracking: boolean;
    subjectThresholds?: Record<string, number>;
  };
  subjectsData?: Array<{id: string, name: string, code: string}>;
  onUpdateSettings: (settings: any) => void;
};

const SettingsForm = ({ settings, subjectsData = [], onUpdateSettings }: SettingsProps) => {
  const [formValues, setFormValues] = React.useState(settings);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormValues({
      ...formValues,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubjectThresholdChange = (subjectId: string, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setFormValues({
      ...formValues,
      subjectThresholds: {
        ...(formValues.subjectThresholds || {}),
        [subjectId]: numValue
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formValues);
    toast.success("Settings updated successfully");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animated-entry">
      <div className="glass-card p-6 space-y-4">
        <h3 className="card-heading">Campus Settings</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campusName">Campus Name</Label>
            <Input
              id="campusName"
              name="campusName"
              value={formValues.campusName}
              onChange={handleChange}
              placeholder="Enter your campus name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="requiredAttendance">Global Required Attendance (%)</Label>
            <Input
              id="requiredAttendance"
              name="requiredAttendance"
              type="number"
              min="0"
              max="100"
              value={formValues.requiredAttendance}
              onChange={handleChange}
            />
            <p className="text-xs text-muted-foreground">
              Default attendance threshold for all subjects
            </p>
          </div>
        </div>
      </div>

      {subjectsData.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="card-heading">Subject-wise Attendance Thresholds</h3>
          
          <div className="space-y-4">
            {subjectsData.map((subject) => (
              <div key={subject.id} className="space-y-2">
                <Label htmlFor={`subject-${subject.id}`}>{subject.name} ({subject.code})</Label>
                <Input
                  id={`subject-${subject.id}`}
                  name={`subject-${subject.id}`}
                  type="number"
                  min="0"
                  max="100"
                  value={(formValues.subjectThresholds && formValues.subjectThresholds[subject.id]) || formValues.requiredAttendance}
                  onChange={(e) => handleSubjectThresholdChange(subject.id, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-6 space-y-4">
        <h3 className="card-heading">App Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive alerts about your attendance status
              </p>
            </div>
            <Switch
              id="notifications"
              name="notifications"
              checked={formValues.notifications}
              onCheckedChange={(checked) =>
                setFormValues({ ...formValues, notifications: checked })
              }
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="locationTracking">Location Tracking</Label>
              <p className="text-xs text-muted-foreground">
                Allow app to detect when you're on campus
              </p>
            </div>
            <Switch
              id="locationTracking"
              name="locationTracking"
              checked={formValues.locationTracking}
              onCheckedChange={(checked) =>
                setFormValues({ ...formValues, locationTracking: checked })
              }
            />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full">
        Save Settings
      </Button>
    </form>
  );
};

export default SettingsForm;
