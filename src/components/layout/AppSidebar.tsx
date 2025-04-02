
import React from "react";
import { NavLink } from "react-router-dom";
import { Calendar, Clock, MapPin, Settings, User, BookOpen } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Dashboard",
    path: "/",
    icon: Clock,
  },
  {
    title: "Attendance",
    path: "/attendance",
    icon: Calendar,
  },
  {
    title: "Location",
    path: "/location",
    icon: MapPin,
  },
  {
    title: "Timetable",
    path: "/timetable",
    icon: BookOpen,
  },
  {
    title: "Profile",
    path: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
  },
];

const AppSidebar = () => {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium mr-3">
            A
          </div>
          <div>
            <h3 className="font-medium text-lg">AttendSmart</h3>
            <p className="text-xs text-muted-foreground">
              Smart Attendance Tracking
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        isActive ? "text-primary" : ""
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            <p>Version 1.0.0</p>
          </div>
          <SidebarTrigger />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
