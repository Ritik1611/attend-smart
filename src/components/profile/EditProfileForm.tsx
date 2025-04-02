
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { updateUserProfile } from "@/services/attendanceService";

const EditProfileForm = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    studentId: "",
    department: "Computer Science",
    batch: "2023-2027",
    semester: "3rd Semester",
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData({
            name: data.name || "",
            studentId: data.studentId || "",
            department: data.department || "Computer Science",
            batch: data.batch || "2023-2027",
            semester: data.semester || "3rd Semester",
          });
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast.error("Failed to load profile data");
      }
    };
    
    fetchProfileData();
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setProfileData({ ...profileData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    try {
      setIsLoading(true);
      await updateUserProfile(currentUser.uid, profileData);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your profile information</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              value={profileData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="studentId">Student ID</Label>
            <Input
              id="studentId"
              name="studentId"
              value={profileData.studentId}
              onChange={handleInputChange}
              placeholder="Enter your student ID"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={profileData.department}
              onValueChange={(value) => handleSelectChange("department", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
                <SelectItem value="Information Technology">Information Technology</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Mechanical">Mechanical</SelectItem>
                <SelectItem value="Civil">Civil</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="batch">Batch</Label>
            <Select
              value={profileData.batch}
              onValueChange={(value) => handleSelectChange("batch", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023-2027">2023-2027</SelectItem>
                <SelectItem value="2022-2026">2022-2026</SelectItem>
                <SelectItem value="2021-2025">2021-2025</SelectItem>
                <SelectItem value="2020-2024">2020-2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="semester">Current Semester</Label>
            <Select
              value={profileData.semester}
              onValueChange={(value) => handleSelectChange("semester", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1st Semester">1st Semester</SelectItem>
                <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                <SelectItem value="3rd Semester">3rd Semester</SelectItem>
                <SelectItem value="4th Semester">4th Semester</SelectItem>
                <SelectItem value="5th Semester">5th Semester</SelectItem>
                <SelectItem value="6th Semester">6th Semester</SelectItem>
                <SelectItem value="7th Semester">7th Semester</SelectItem>
                <SelectItem value="8th Semester">8th Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Updating..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EditProfileForm;
