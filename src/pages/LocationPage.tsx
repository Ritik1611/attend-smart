
import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, Circle } from "@react-google-maps/api";
import { Compass, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { toast } from "sonner";
import LocationDetection from "@/components/location/LocationDetection";

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = "AIzaSyCYNxNTXSi5u7xg-uWfqsM40YKxr-MJTZM";

// Map container styles
const mapContainerStyle = {
  width: "100%",
  height: "250px",
  borderRadius: "0.5rem"
};

const LocationPage = () => {
  const { currentUser } = useAuth();
  const [isOnCampus, setIsOnCampus] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [campusData, setCampusData] = useState<{
    name: string;
    latitude: number;
    longitude: number;
    radius: number;
  } | null>(null);
  const [userPosition, setUserPosition] = useState<{lat: number, lng: number} | null>(null);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY
  });

  useEffect(() => {
    const fetchCampusData = async () => {
      try {
        // Get user ID from Firebase Auth or localStorage
        const userId = currentUser?.uid || JSON.parse(localStorage.getItem("user") || "{}").id;
        
        if (!userId) {
          console.error("No user ID found");
          return;
        }

        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists() && userDoc.data().campusLocation) {
          setCampusData(userDoc.data().campusLocation);
          
          // Also check if user is on campus based on last record
          if (userDoc.data().isOnCampus !== undefined) {
            setIsOnCampus(userDoc.data().isOnCampus);
          }
        }
      } catch (error) {
        console.error("Error fetching campus data:", error);
        toast.error("Failed to load campus data");
      }
    };

    fetchCampusData();
  }, [currentUser]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    // Haversine formula to calculate distance between two points
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in meters
  };

  const handleDetectLocation = async (position: GeolocationPosition) => {
    setIsLoading(true);
    
    if (!campusData) {
      toast.error("Campus location not set up yet");
      setIsLoading(false);
      return;
    }

    try {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      
      setUserPosition({ lat: userLat, lng: userLng });
      
      // Calculate distance using the Haversine formula
      const distance = calculateDistance(
        campusData.latitude, 
        campusData.longitude, 
        userLat, 
        userLng
      );
      
      const onCampus = distance <= campusData.radius;
      setIsOnCampus(onCampus);

      // Get user ID and update the isOnCampus status in Firestore
      const userId = currentUser?.uid || JSON.parse(localStorage.getItem("user") || "{}").id;
      
      if (userId) {
        await updateDoc(doc(db, "users", userId), {
          isOnCampus: onCampus,
          lastLocationCheck: new Date().toISOString()
        });
      }
      
      if (onCampus) {
        toast.success("You are on campus!");
      } else {
        toast.info(`You are ${Math.round(distance)} meters away from campus`);
      }
    } catch (error) {
      console.error("Error calculating distance:", error);
      toast.error("Failed to determine if you're on campus");
    } finally {
      setIsLoading(false);
    }
  };

  const campusCenter = campusData ? { 
    lat: campusData.latitude, 
    lng: campusData.longitude 
  } : null;

  return (
    <div className="container max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Location</h1>
      
      {!campusData ? (
        <Card>
          <CardHeader>
            <CardTitle>Campus Not Set Up</CardTitle>
            <CardDescription>
              You need to set up your campus location first
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = "/setup/location"}
            >
              Set Up Campus Location
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{campusData.name}</CardTitle>
              <CardDescription>
                Your campus location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoaded && campusCenter ? (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={campusCenter}
                  zoom={15}
                  options={{ disableDefaultUI: true, zoomControl: true }}
                >
                  <Marker position={campusCenter} />
                  <Circle
                    center={campusCenter}
                    radius={campusData.radius}
                    options={{
                      fillColor: "rgba(66, 133, 244, 0.2)",
                      fillOpacity: 0.5,
                      strokeColor: "#4285F4",
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                    }}
                  />
                  {userPosition && (
                    <Marker 
                      position={userPosition}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 7,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeColor: "#FFFFFF",
                        strokeWeight: 2,
                      }}
                    />
                  )}
                </GoogleMap>
              ) : (
                <div className="flex items-center justify-center h-[250px] bg-muted rounded-md">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Latitude:</span>
                  <div className="bg-muted p-1 rounded font-mono">
                    {campusData.latitude.toFixed(6)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Longitude:</span>
                  <div className="bg-muted p-1 rounded font-mono">
                    {campusData.longitude.toFixed(6)}
                  </div>
                </div>
                <div className="col-span-2 mt-2">
                  <span className="text-muted-foreground">Attendance Zone Radius:</span>
                  <div className="bg-muted p-1 rounded">
                    {campusData.radius} meters
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <LocationDetection 
            onDetectLocation={handleDetectLocation}
            isLoading={isLoading}
            isOnCampus={isOnCampus}
          />
        </div>
      )}
    </div>
  );
};

export default LocationPage;
