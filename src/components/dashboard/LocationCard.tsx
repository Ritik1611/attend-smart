
import React, { useEffect, useState } from "react";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type LocationCardProps = {
  isOnCampus: boolean;
  campusName: string;
  lastCheckedTime: string;
  onCheckLocation: () => void;
};

const LocationCard = ({
  isOnCampus,
  campusName,
  lastCheckedTime,
  onCheckLocation,
}: LocationCardProps) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [campus, setCampus] = useState({name: campusName});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCampusData = async () => {
      if (!currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists() && userDoc.data().campusLocation) {
          setCampus({
            name: userDoc.data().campusLocation.name
          });
        }
      } catch (error) {
        console.error("Error fetching campus data:", error);
      }
    };

    fetchCampusData();
  }, [currentUser]);

  const handleCheckLocation = () => {
    if (!currentUser) {
      // Get user from localStorage if not authenticated with Firebase
      const localUser = localStorage.getItem("user");
      if (!localUser) {
        toast.error("You must be logged in to use this feature");
        navigate("/auth");
        return;
      }
    }
    
    setLoading(true);
    onCheckLocation();
    setLoading(false);
  };

  return (
    <div className="glass-card p-6 space-y-4 animated-entry">
      <div className="flex items-center justify-between">
        <h3 className="card-heading">Location Status</h3>
        {isOnCampus ? (
          <div className="chip-success">On Campus</div>
        ) : (
          <div className="chip-warning">Off Campus</div>
        )}
      </div>

      <div className="flex items-center space-x-4 py-2">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Map className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="font-medium">{campus.name}</p>
          <p className="text-xs text-muted-foreground">Last checked: {lastCheckedTime}</p>
        </div>
      </div>

      <Button
        onClick={handleCheckLocation}
        className="w-full transition-all duration-300 hover:shadow-md"
        disabled={loading}
      >
        {loading ? "Checking..." : isOnCampus ? "Mark Attendance" : "Check Location"}
      </Button>
    </div>
  );
};

export default LocationCard;
