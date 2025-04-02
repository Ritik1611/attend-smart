
import React from "react";
import { NavLink } from "react-router-dom";
import { Calendar, Clock, MapPin, Settings, User, BookOpen } from "lucide-react";

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
];

const MobileNavBar = () => {
  return (
    <>
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium mr-3">
            A
          </div>
          <h1 className="font-medium text-lg">AttendSmart</h1>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-40">
        <div className="grid grid-cols-5 h-16">
          {navigationItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs mt-1">{item.title}</span>
            </NavLink>
          ))}
        </div>
      </div>
      <div className="h-16"></div>
    </>
  );
};

export default MobileNavBar;
