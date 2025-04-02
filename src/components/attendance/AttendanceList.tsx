import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pencil, AlertCircle, Loader2 } from "lucide-react";
import EditAttendanceDialog from "./EditAttendanceDialog";
import { AttendanceApiService } from "@/services/attendanceApiService";
import { toast } from "sonner";
import { getUserAttendanceRecords } from "@/services/attendanceDataService";

interface AttendanceListProps {
  userId: string;
}

const AttendanceList: React.FC<AttendanceListProps> = ({ userId }) => {
  const [editRecord, setEditRecord] = useState<any>(null);
  const [localRecords, setLocalRecords] = useState<any[]>([]);
  
  const { data: attendanceRecords, isLoading, error, refetch } = useQuery({
    queryKey: ['attendance', userId],
    queryFn: () => AttendanceApiService.getUserAttendance(userId),
    retry: 1
  });
  
  useEffect(() => {
    if (error) {
      console.error("Falling back to Firestore due to API error:", error);
      const fetchFirestoreData = async () => {
        try {
          const firestoreRecords = await getUserAttendanceRecords(userId);
          setLocalRecords(firestoreRecords);
        } catch (fbError) {
          console.error("Firestore fallback also failed:", fbError);
        }
      };
      fetchFirestoreData();
    }
  }, [error, userId]);
  
  const handleEditClick = (record: any) => {
    setEditRecord(record);
  };
  
  const handleCloseDialog = () => {
    setEditRecord(null);
  };
  
  const handleSuccess = () => {
    refetch();
  };
  
  const records = attendanceRecords || localRecords;
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading attendance records...</span>
      </div>
    );
  }
  
  if (error && localRecords.length === 0) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load attendance records. Please try again later or contact support.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Records</CardTitle>
      </CardHeader>
      <CardContent>
        {records && records.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.classId}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                        ${record.status === 'present' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                          record.status === 'absent' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          record.status === 'holiday' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditClick(record)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No attendance records found</div>
        )}
      </CardContent>
      
      {editRecord && (
        <EditAttendanceDialog 
          open={!!editRecord}
          onClose={handleCloseDialog}
          attendanceRecord={editRecord}
          onSuccess={handleSuccess}
        />
      )}
    </Card>
  );
};

export default AttendanceList;
