
import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
} from "@/components/ui/chart";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getUserAttendanceRecords, 
  getWeeklyAttendanceData, 
  getMonthlyAttendanceData, 
  getSubjectAnalyticsData, 
  getAttendancePieData 
} from "@/services/attendanceDataService";

const COLORS = ["#16a34a", "#dc2626"];

const AttendanceAnalytics = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);
        
        // Get user ID (from Firebase Auth or localStorage)
        const userId = currentUser?.uid || JSON.parse(localStorage.getItem("user") || "{}").id;
        
        if (!userId) {
          console.error("No user ID found");
          return;
        }
        
        // Fetch attendance records
        const records = await getUserAttendanceRecords(userId);
        
        // Process data for different views
        setWeeklyData(getWeeklyAttendanceData(records));
        setMonthlyData(getMonthlyAttendanceData(records));
        setSubjectData(getSubjectAnalyticsData(records));
        setPieData(getAttendancePieData(records));
      } catch (error) {
        console.error("Error fetching attendance analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceData();
  }, [currentUser]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Analytics</CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p>Loading attendance data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animated-entry">
      <CardHeader>
        <CardTitle>Attendance Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="subject">By Subject</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-3">Daily Attendance</h4>
                <div className="h-72">
                  <ChartContainer
                    config={{
                      present: { theme: { light: "#16a34a", dark: "#22c55e" } },
                      absent: { theme: { light: "#dc2626", dark: "#ef4444" } },
                    }}
                  >
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="present" name="Present" fill="var(--color-present)" />
                      <Bar dataKey="absent" name="Absent" fill="var(--color-absent)" />
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">Attendance Overview</h4>
                <div className="h-72 flex flex-col items-center justify-center">
                  <PieChart width={200} height={200}>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                  <div className="flex space-x-6 mt-4">
                    {pieData.map((entry, index) => (
                      <div key={`legend-${index}`} className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-sm">
                          {entry.name}: {entry.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="monthly">
            <div className="h-80">
              <ChartContainer
                config={{
                  present: { theme: { light: "#16a34a", dark: "#22c55e" } },
                  absent: { theme: { light: "#dc2626", dark: "#ef4444" } },
                }}
              >
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="present"
                    name="Present"
                    stroke="var(--color-present)"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="absent"
                    name="Absent"
                    stroke="var(--color-absent)"
                  />
                </LineChart>
              </ChartContainer>
            </div>
          </TabsContent>

          <TabsContent value="subject">
            <div className="space-y-4">
              {subjectData.map((subject) => (
                <div key={subject.name} className="bg-muted/50 p-3 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{subject.name}</span>
                    <span
                      className={
                        subject.percentage >= 75
                          ? "text-emerald-600 dark:text-emerald-400 font-medium"
                          : "text-rose-600 dark:text-rose-400 font-medium"
                      }
                    >
                      {subject.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        subject.percentage >= 75
                          ? "bg-emerald-500"
                          : "bg-rose-500"
                      }`}
                      style={{ width: `${subject.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Present: {subject.present}</span>
                    <span>Absent: {subject.absent}</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AttendanceAnalytics;
