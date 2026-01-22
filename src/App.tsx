
import React, { useEffect, useState } from "react";
import { SpeedInsights } from "@vercel/speed-insights/react";
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
  const [apiStatus, setApiStatus] = useState<'connected' | 'error'>('connected');

  // We've removed the API connectivity check since we're now using Firebase directly

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
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
            <Sonner />
            <SpeedInsights />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
