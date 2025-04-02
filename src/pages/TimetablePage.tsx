
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TimetableForm from "@/components/timetable/TimetableForm";
import TimetableDisplay from "@/components/timetable/TimetableDisplay";
import HolidaySelector from "@/components/timetable/HolidaySelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserTimetable, updateUserTimetable, ClassItem, Timetable, getEmptyTimetable } from "@/services/timetableService";
import { Loader2 } from "lucide-react";

const TimetablePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [timetable, setTimetable] = useState<Timetable>(getEmptyTimetable());
  const [holidays, setHolidays] = useState<string[]>([]);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("view");

  useEffect(() => {
    const loadTimetable = async () => {
      if (!currentUser) {
        // Check local storage for demo user
        const localUser = localStorage.getItem("user");
        if (!localUser) {
          navigate("/auth");
          return;
        }
      }

      try {
        setIsLoading(true);
        
        // Get user ID from Firebase Auth or localStorage
        const userId = currentUser?.uid || JSON.parse(localStorage.getItem("user") || "{}").id;
        
        if (!userId) {
          console.error("No user ID found");
          navigate("/auth");
          return;
        }

        const { timetable: userTimetable, holidays: userHolidays } = await fetchUserTimetable(userId);
        setTimetable(userTimetable);
        setHolidays(userHolidays);
      } catch (error) {
        console.error("Error loading timetable:", error);
        toast.error("Failed to load timetable data");
      } finally {
        setIsLoading(false);
      }
    };

    loadTimetable();
  }, [currentUser, navigate]);

  const autoSaveTimetable = () => {
    // Clear any existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    
    // Set a new timeout to save after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      handleSaveTimetable(true);
    }, 2000);
    
    setAutoSaveTimeout(timeout);
  };

  // Clean up the timeout when component unmounts
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  const handleAddClass = (day: string, newClass: ClassItem) => {
    setTimetable((prev) => {
      // Type assertion to ensure the compiler knows we're using proper keys
      const dayKey = day as keyof Timetable;
      const updatedTimetable = {
        ...prev,
        [dayKey]: [...(prev[dayKey] || []), newClass]
      };
      
      // Trigger auto-save after update
      autoSaveTimetable();
      return updatedTimetable;
    });
    
    // Switch to view tab after adding a class
    setActiveTab("view");
  };

  const handleRemoveClass = (day: string, index: number) => {
    setTimetable((prev) => {
      // Type assertion for the day key
      const dayKey = day as keyof Timetable;
      const updatedTimetable = {
        ...prev,
        [dayKey]: prev[dayKey].filter((_, i) => i !== index)
      };
      
      // Trigger auto-save after update
      autoSaveTimetable();
      return updatedTimetable;
    });
  };

  const handleUpdateClass = (day: string, index: number, updatedClass: ClassItem) => {
    setTimetable((prev) => {
      // Type assertion for the day key
      const dayKey = day as keyof Timetable;
      const updatedTimetable = {
        ...prev,
        [dayKey]: prev[dayKey].map((item, i) => (i === index ? updatedClass : item))
      };
      
      // Trigger auto-save after update
      autoSaveTimetable();
      return updatedTimetable;
    });
  };

  const handleHolidayChange = (selectedHolidays: string[]) => {
    setHolidays(selectedHolidays);
    // Trigger auto-save after update
    autoSaveTimetable();
  };

  const handleSaveTimetable = async (silent = false) => {
    if (!currentUser && !localStorage.getItem("user")) {
      toast.error("You must be logged in to save your timetable");
      navigate("/auth");
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Get user ID from Firebase Auth or localStorage
      const userId = currentUser?.uid || JSON.parse(localStorage.getItem("user") || "{}").id;
      
      if (!userId) {
        toast.error("User ID not found");
        return;
      }

      // Save timetable and holidays using the service
      await updateUserTimetable(userId, timetable, holidays);
      
      if (!silent) {
        toast.success("Timetable saved successfully");
      }
    } catch (error) {
      console.error("Error saving timetable:", error);
      toast.error("Failed to save timetable");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && Object.keys(timetable).length === 0) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span className="text-lg">Loading timetable...</span>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">Timetable Management</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Your Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
              <TabsTrigger value="view">View Timetable</TabsTrigger>
              <TabsTrigger value="add">Add Class</TabsTrigger>
              <TabsTrigger value="holidays">Holidays</TabsTrigger>
            </TabsList>
            
            <TabsContent value="view" className="space-y-4">
              <TimetableDisplay 
                timetable={timetable}
                onRemoveClass={handleRemoveClass}
                onUpdateClass={handleUpdateClass}
                holidays={holidays}
              />
            </TabsContent>
            
            <TabsContent value="add" className="space-y-4">
              <TimetableForm onAddClass={handleAddClass} />
            </TabsContent>
            
            <TabsContent value="holidays" className="space-y-4">
              <HolidaySelector 
                selectedHolidays={holidays}
                onChange={handleHolidayChange}
              />
            </TabsContent>
          </Tabs>
          
          <div className="mt-8">
            <Button 
              onClick={() => handleSaveTimetable(false)}
              disabled={isLoading || isSaving}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Saving...
                </>
              ) : "Save Changes"}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Changes are saved automatically after 2 seconds. You can also save manually with this button.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimetablePage;
