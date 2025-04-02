
import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import TimetableForm from "./TimetableForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ClassItem, Timetable } from "@/services/timetableService";

interface TimetableDisplayProps {
  timetable: Timetable;
  onRemoveClass: (day: string, index: number) => void;
  onUpdateClass: (day: string, index: number, updatedClass: ClassItem) => void;
  holidays: string[];
}

const TimetableDisplay: React.FC<TimetableDisplayProps> = ({
  timetable,
  onRemoveClass,
  onUpdateClass,
  holidays,
}) => {
  const [editingClass, setEditingClass] = useState<{
    day: string;
    index: number;
    class: ClassItem;
  } | null>(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState<{
    day: string;
    index: number;
    className: string;
  } | null>(null);

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  
  const dayLabels = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  const handleEditClass = (day: string, index: number, classData: ClassItem) => {
    setEditingClass({
      day,
      index,
      class: classData,
    });
  };

  const handleConfirmEdit = () => {
    setEditingClass(null);
  };

  const handleDeleteClass = (day: string, index: number, className: string) => {
    setDeleteConfirm({
      day,
      index,
      className,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm) {
      onRemoveClass(deleteConfirm.day, deleteConfirm.index);
      setDeleteConfirm(null);
    }
  };

  const isHoliday = (day: string) => {
    return holidays && holidays.includes(day);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Weekly Schedule</h3>
      <ScrollArea className="h-[400px] md:h-[500px]">
        <div className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Day</TableHead>
                <TableHead>Classes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map((day) => (
                <TableRow key={day} className={isHoliday(day) ? "bg-muted/30" : ""}>
                  <TableCell className="font-medium">
                    {dayLabels[day as keyof typeof dayLabels]}
                    {isHoliday(day) && (
                      <span className="ml-2 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded">
                        Holiday
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {timetable && timetable[day as keyof Timetable] && timetable[day as keyof Timetable].length > 0 ? (
                      <div className="space-y-2">
                        {timetable[day as keyof Timetable].map((classItem, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between bg-card p-2 rounded-md border"
                          >
                            <div>
                              <div className="font-medium">{classItem.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {classItem.code} • {classItem.startTime} - {classItem.endTime}
                                {classItem.location && ` • ${classItem.location}`}
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEditClass(day, index, classItem)}
                              >
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteClass(day, index, classItem.name)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">No classes scheduled</div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>

      {/* Edit Class Dialog */}
      <Dialog open={!!editingClass} onOpenChange={(open) => !open && setEditingClass(null)}>
        <DialogContent>
          <h2 className="text-xl font-semibold mb-4">Edit Class</h2>
          {editingClass && (
            <TimetableForm
              classToEdit={editingClass}
              onAddClass={(day, updatedClass) => {
                onUpdateClass(day, editingClass.index, updatedClass);
              }}
              onUpdate={handleConfirmEdit}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!deleteConfirm} 
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteConfirm?.className}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TimetableDisplay;
