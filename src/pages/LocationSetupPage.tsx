
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { db, auth } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useLoadScript, GoogleMap, Marker, Circle } from '@react-google-maps/api';

// Default map center (adjust as needed)
const defaultCenter = { lat: 37.7749, lng: -122.4194 };

// Google Maps API Key - using a direct string instead of process.env
const GOOGLE_MAPS_API_KEY = 'AIzaSyCYNxNTXSi5u7xg-uWfqsM40YKxr-MJTZM';

const libraries = ['places'];

const LocationSetupPage = () => {
  const [campusName, setCampusName] = useState('');
  const [location, setLocation] = useState(defaultCenter);
  const [radius, setRadius] = useState(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Load the Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY, // Direct reference to the constant
    libraries: libraries as any,
  });

  // Get user's current location on component mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting current location:", error);
          toast({
            title: "Location Error",
            description: "Could not get your current location. Using default map center.",
            variant: "destructive"
          });
        }
      );
    }
  }, [toast]);

  // Handle map click to set location
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setLocation({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!campusName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a campus name.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const currentUser = auth.currentUser;
      let userId;
      
      if (!currentUser) {
        // Handle case where user is not authenticated with Firebase Auth
        const localUser = localStorage.getItem("user");
        if (localUser) {
          const parsedUser = JSON.parse(localUser);
          userId = parsedUser.id;
        } else {
          throw new Error("No authenticated user found.");
        }
      } else {
        // User is authenticated with Firebase Auth
        userId = currentUser.uid;
      }
      
      // Save to Firestore
      const campusLocation = {
        name: campusName,
        latitude: location.lat,
        longitude: location.lng,
        radius: radius
      };
      
      await setDoc(doc(db, "users", userId), {
        campusLocation: campusLocation,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      toast({
        title: "Success!",
        description: "Your campus location has been saved.",
      });
      
      navigate('/');
    } catch (error) {
      console.error("Error saving campus location:", error);
      toast({
        title: "Error",
        description: `Failed to save campus location: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps...</div>;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Set Your Campus Location</CardTitle>
          <CardDescription>
            Define where your campus is located to automatically track attendance when you're there.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="campus-name">Campus Name</Label>
              <Input
                id="campus-name"
                value={campusName}
                onChange={(e) => setCampusName(e.target.value)}
                placeholder="e.g. University Main Campus"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="radius">Attendance Radius (meters)</Label>
              <Input
                id="radius"
                type="number"
                min="10"
                max="1000"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                required
              />
              <p className="text-sm text-muted-foreground">
                This defines how close you need to be to the marked location to be counted as present.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Map Location</Label>
              <div style={{ height: "400px", width: "100%" }}>
                <GoogleMap
                  mapContainerStyle={{ height: "100%", width: "100%" }}
                  center={location}
                  zoom={15}
                  onClick={handleMapClick}
                >
                  <Marker position={location} />
                  <Circle
                    center={location}
                    radius={radius}
                    options={{
                      fillColor: "#1e40af",
                      fillOpacity: 0.2,
                      strokeColor: "#1e40af",
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                    }}
                  />
                </GoogleMap>
              </div>
              <p className="text-sm text-muted-foreground">
                Click on the map to select your campus location.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Location & Finish Setup"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LocationSetupPage;
