
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileNavBar from "./MobileNavBar";
import { initAttendanceCheck } from "@/services/attendanceService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AppLayoutProps {
  apiStatus: 'connected' | 'error'; // Keeping this for backward compatibility
}

const AppLayout: React.FC<AppLayoutProps> = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);

  // Check if user is authenticated
  const isAuthenticated = currentUser !== null || localStorage.getItem("user") !== null;

  // Get user ID either from Firebase Auth or local storage
  useEffect(() => {
    const getUserId = () => {
      if (currentUser) {
        setUserId(currentUser.uid);
        return currentUser.uid;
      } else {
        // If not authenticated with Firebase, try to get from localStorage
        const localUser = localStorage.getItem("user");
        if (localUser) {
          try {
            const parsedUser = JSON.parse(localUser);
            setUserId(parsedUser.id);
            return parsedUser.id;
          } catch (error) {
            console.error("Error parsing user from localStorage:", error);
            return null;
          }
        }
      }
      return null;
    };
    
    const uid = getUserId();
    console.log("AppLayout - User ID:", uid);
  }, [currentUser]);

  useEffect(() => {
    // Redirect unauthenticated users to auth page
    if (!isAuthenticated && !location.pathname.includes('/auth') && !location.pathname.includes('/setup')) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    // Initialize the attendance checking service
    if (isAuthenticated && userId) {
      console.log("Initializing attendance check with user ID:", userId);
      initAttendanceCheck(userId);
    }
  }, [isAuthenticated, userId]);

  // Fake user data for demonstration
  useEffect(() => {
    // This is just for demonstration to simulate a logged-in user
    // In a real app, this would come from Firebase Auth
    if (!localStorage.getItem("user") && !currentUser) {
      const demoUser = {
        id: "user123",
        name: "Demo User",
        email: "demo@example.com"
      };
      localStorage.setItem("user", JSON.stringify(demoUser));
      console.log("Created demo user:", demoUser);
      
      toast("Demo Mode", {
        description: "Using demo user for testing. In production, use proper authentication.",
      });
    }
  }, [currentUser]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col w-full">
        <div className="flex flex-1">
          {!isMobile && <AppSidebar />}
          <div className="flex-1 flex flex-col min-h-screen">
            {isMobile && <MobileNavBar />}
            <main className="flex-1 overflow-auto">
              <div className="page-container">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
