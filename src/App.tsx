
import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import Index from "./pages/Index";
import AttendancePage from "./pages/AttendancePage";
import LocationPage from "./pages/LocationPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import TimetableSetupPage from "./pages/TimetableSetupPage";
import LocationSetupPage from "./pages/LocationSetupPage";
import TimetablePage from "./pages/TimetablePage";
import ApiService from "./services/apiService";
import { toast } from "sonner";

// Create a new QueryClient instance with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      meta: {
        onError: (error: any) => {
          console.error("Query error:", error);
          toast.error("API request failed. Please try again or check your connection.");
        },
      },
    },
    mutations: {
      meta: {
        onError: (error: any) => {
          console.error("Mutation error:", error);
          toast.error("Couldn't save changes. Please try again or check your connection.");
        },
      },
    },
  },
});

const App = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Check API connectivity on startup
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        console.log("🔍 Checking API connectivity...");
        const response = await ApiService.get<{status: string}>('/status');
        
        if (response.success) {
          console.log("✅ API connected successfully!");
          setApiStatus('connected');
          toast.success("Connected to API server");
        } else {
          console.warn("⚠️ API health check failed, but continuing with fallbacks");
          setApiStatus('error');
          toast.warning("API connection issues. Some features may be limited.");
        }
      } catch (error) {
        console.error("❌ API connection failed:", error);
        setApiStatus('error');
        toast.error("Couldn't connect to API server. Using offline mode.");
      }
    };

    checkApiStatus();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            {apiStatus === 'checking' ? (
              <div className="flex items-center justify-center h-screen bg-gradient-to-b from-primary/10 to-background">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <h2 className="text-xl font-semibold">Connecting to API...</h2>
                  <p className="text-muted-foreground">Please wait while we establish connection</p>
                </div>
              </div>
            ) : (
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/setup/timetable" element={<TimetableSetupPage />} />
                <Route path="/setup/location" element={<LocationSetupPage />} />
                <Route element={<AppLayout apiStatus={apiStatus} />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/attendance" element={<AttendancePage />} />
                  <Route path="/location" element={<LocationPage />} />
                  <Route path="/timetable" element={<TimetablePage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            )}
            <Sonner />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
