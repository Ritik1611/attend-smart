
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TimetableForm from "@/components/timetable/TimetableForm";
import TimetableDisplay from "@/components/timetable/TimetableDisplay";
import HolidaySelector from "@/components/timetable/HolidaySelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const TimetableSetupPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [timetable, setTimetable] = useState<any>({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });
  const [holidays, setHolidays] = useState<string[]>([]);
  const [isFirstSetup, setIsFirstSetup] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
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

        const userDoc = await getDoc(doc(db, "users", userId));
        
        if (userDoc.exists() && userDoc.data().timetable) {
          setTimetable(userDoc.data().timetable);
          setHolidays(userDoc.data().holidays || []);
          setIsFirstSetup(false);
        }
      } catch (error) {
        console.error("Error fetching timetable:", error);
        toast.error("Failed to load timetable data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimetable();
  }, [currentUser, navigate]);

  const handleAddClass = (day: string, newClass: any) => {
    setTimetable((prev: any) => ({
      ...prev,
      [day]: [...prev[day], newClass],
    }));
  };

  const handleRemoveClass = (day: string, index: number) => {
    setTimetable((prev: any) => ({
      ...prev,
      [day]: prev[day].filter((_: any, i: number) => i !== index),
    }));
  };

  const handleUpdateClass = (day: string, index: number, updatedClass: any) => {
    setTimetable((prev: any) => ({
      ...prev,
      [day]: prev[day].map((item: any, i: number) => (i === index ? updatedClass : item)),
    }));
  };

  const handleHolidayChange = (selectedHolidays: string[]) => {
    setHolidays(selectedHolidays);
  };

  const handleSaveTimetable = async () => {
    if (!currentUser && !localStorage.getItem("user")) {
      toast.error("You must be logged in to save your timetable");
      navigate("/auth");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Get user ID from Firebase Auth or localStorage
      const userId = currentUser?.uid || JSON.parse(localStorage.getItem("user") || "{}").id;
      
      if (!userId) {
        toast.error("User ID not found");
        return;
      }

      // Save timetable and holidays to Firestore
      await setDoc(doc(db, "users", userId), {
        timetable,
        holidays,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      toast.success("Timetable saved successfully");
      
      // If it's first setup, navigate to the location setup page
      if (isFirstSetup) {
        navigate("/setup/location");
      }
    } catch (error) {
      console.error("Error saving timetable:", error);
      toast.error("Failed to save timetable");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl animated-entry">
        <CardHeader>
          <CardTitle className="text-2xl">{isFirstSetup ? "Set Up Your Timetable" : "Manage Your Timetable"}</CardTitle>
          <CardDescription>
            Add your classes and set your weekly schedule. Don't forget to mark your holidays!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="timetable" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="timetable">Timetable</TabsTrigger>
              <TabsTrigger value="holidays">Holidays</TabsTrigger>
            </TabsList>
            <TabsContent value="timetable">
              <div className="space-y-6">
                <TimetableForm 
                  onAddClass={handleAddClass} 
                />
                <TimetableDisplay 
                  timetable={timetable}
                  onRemoveClass={handleRemoveClass}
                  onUpdateClass={handleUpdateClass}
                  holidays={holidays}
                />
              </div>
            </TabsContent>
            <TabsContent value="holidays">
              <HolidaySelector 
                selectedHolidays={holidays}
                onChange={handleHolidayChange}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={handleSaveTimetable}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : isFirstSetup ? "Save and Continue" : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TimetableSetupPage;
