
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AttendanceApiService } from "@/services/attendanceApiService";

interface EditAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  attendanceRecord: {
    id: string;
    userId: string;
    classId: string;
    date: string;
    status: 'present' | 'absent' | 'holiday' | 'pending';
  };
  onSuccess: () => void;
}

const EditAttendanceDialog: React.FC<EditAttendanceDialogProps> = ({ 
  open, 
  onClose, 
  attendanceRecord,
  onSuccess
}) => {
  const [status, setStatus] = useState<'present' | 'absent' | 'holiday' | 'pending'>(attendanceRecord.status);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      await AttendanceApiService.updateAttendance(attendanceRecord.id, { status });
      toast.success("Attendance updated successfully");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating attendance:", error);
      toast.error("Failed to update attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Attendance</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Class: {attendanceRecord.classId}</p>
            <p className="text-sm font-medium">Date: {attendanceRecord.date}</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(value) => setStatus(value as 'present' | 'absent' | 'holiday' | 'pending')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditAttendanceDialog;
