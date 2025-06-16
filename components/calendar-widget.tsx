"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  User,
  Clock,
  Info,
  Building2,
  Users,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "renewal" | "event" | "payment" | "registration";
  memberName?: string;
  amount?: number;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  created_by: string;
  created_at: string;
  members?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface CalendarWidgetProps {
  events: Event[];
}

export function CalendarWidget({ events }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(new Date(year, month + (direction === "next" ? 1 : -1), 1));
  };

  const getEventsForDate = (date: string) => {
    return events.filter((event) => {
      const eventDate = new Date(event.event_date);
      const compareDate = new Date(date);
      return (
        eventDate.getFullYear() === compareDate.getFullYear() &&
        eventDate.getMonth() === compareDate.getMonth() &&
        eventDate.getDate() === compareDate.getDate()
      );
    });
  };

  const getEventIcon = () => {
    return <CalendarDays className="h-3 w-3" />;
  };

  const getEventColor = () => {
    return "bg-purple-100 text-purple-800 border-purple-200";
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 p-1"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const events = getEventsForDate(dateString);
      const isToday =
        today.getDate() === day &&
        today.getMonth() === month &&
        today.getFullYear() === year;
      const isSelected = selectedDate === dateString;

      days.push(
        <div
          key={day}
          className={cn(
            "h-24 p-1 border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
            isToday && "bg-blue-50 border-blue-200",
            isSelected && "bg-blue-100 border-blue-300"
          )}
          onClick={() => setSelectedDate(dateString)}
        >
          <div
            className={cn(
              "text-sm font-medium mb-1",
              isToday && "text-blue-600"
            )}
          >
            {day}
          </div>
          <div className="space-y-1">
            {events.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={cn(
                  "text-xs px-1 py-0.5 rounded border flex items-center gap-1 truncate",
                  getEventColor()
                )}
              >
                {getEventIcon()}
                <span className="truncate">{event.title}</span>
              </div>
            ))}
            {events.length > 2 && (
              <div className="text-xs text-gray-500">
                +{events.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>
                Track events and important dates
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-lg font-semibold min-w-[140px] text-center">
                {monthNames[month]} {year}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-0 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-gray-500 border-b"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0">{renderCalendarDays()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
          <CardDescription>
            {selectedDate
              ? `Events for ${new Date(selectedDate).toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}`
              : "Select a date to view events"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedEvents.length > 0 ? (
            <div className="space-y-4">
              {selectedEvents.map((event) => (
                <div key={event.id} className="space-y-3 p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-full", getEventColor())}>
                      {getEventIcon()}
                    </div>
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {event.description}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(event.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Created by: {event.members?.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              {selectedDate
                ? "No events scheduled"
                : "Select a date to view events"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
