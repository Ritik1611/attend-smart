
import React from "react";
import { Map, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

type LocationDetectionProps = {
  onDetectLocation: (position: GeolocationPosition) => void;
  isLoading: boolean;
  isOnCampus: boolean | null;
};

const LocationDetection = ({
  onDetectLocation,
  isLoading,
  isOnCampus,
}: LocationDetectionProps) => {
  const { currentUser } = useAuth();
  
  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Call the parent's onDetectLocation function
          onDetectLocation(position);
          
          // Also trigger an attendance check immediately
          if (currentUser?.uid) {
            console.log("Manually triggering attendance check with current position");
            import('@/services/attendanceService').then(({ checkAttendance }) => {
              if (typeof checkAttendance === 'function') {
                checkAttendance(position, currentUser.uid);
              } else {
                console.error("checkAttendance function not available");
              }
            }).catch(err => {
              console.error("Failed to import attendanceService:", err);
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Unable to get your location. Please check your device settings.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error("Geolocation is not supported by your browser");
    }
  };

  return (
    <div className="glass-card p-6 space-y-6 animated-entry">
      <h3 className="card-heading">Location Detection</h3>

      <div className="flex flex-col items-center justify-center py-8 space-y-6">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin className="w-10 h-10 text-primary" />
        </div>
        
        {isOnCampus === null ? (
          <p className="text-center text-muted-foreground">
            Detect your location to verify if you're on campus
          </p>
        ) : isOnCampus ? (
          <div className="text-center">
            <p className="font-medium text-emerald-600 dark:text-emerald-400">
              You're on campus!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You can mark your attendance now.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="font-medium text-rose-600 dark:text-rose-400">
              You're not on campus
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              You need to be on campus to mark attendance.
            </p>
          </div>
        )}
      </div>

      <Button
        onClick={handleDetectLocation}
        className="w-full transition-all duration-300 hover:shadow-md"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Detecting...
          </>
        ) : isOnCampus === null ? (
          "Detect Location"
        ) : (
          "Update Location"
        )}
      </Button>
      
      <p className="text-xs text-center text-muted-foreground">
        Make sure your location services are enabled on your device
      </p>
    </div>
  );
};

export default LocationDetection;
