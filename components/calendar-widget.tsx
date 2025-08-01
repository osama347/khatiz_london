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
  translations?: { [key: string]: string };
}

export function CalendarWidget({
  events,
  translations = {},
}: CalendarWidgetProps) {
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
    translations.january || "January",
    translations.february || "February",
    translations.march || "March",
    translations.april || "April",
    translations.may || "May",
    translations.june || "June",
    translations.july || "July",
    translations.august || "August",
    translations.september || "September",
    translations.october || "October",
    translations.november || "November",
    translations.december || "December",
  ];

  const weekDays = [
    translations.sun || "Sun",
    translations.mon || "Mon",
    translations.tue || "Tue",
    translations.wed || "Wed",
    translations.thu || "Thu",
    translations.fri || "Fri",
    translations.sat || "Sat",
  ];

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
            "min-h-[60px] sm:h-24 p-1 border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
            isToday && "bg-blue-50 border-blue-200",
            isSelected && "bg-blue-100 border-blue-300"
          )}
          onClick={() => setSelectedDate(dateString)}
        >
          <div
            className={cn(
              "text-xs sm:text-sm font-medium mb-1",
              isToday && "text-blue-600"
            )}
          >
            {day}
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            {events.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={cn(
                  "text-[10px] sm:text-xs px-0.5 sm:px-1 py-0.5 rounded border flex items-center gap-0.5 sm:gap-1 truncate",
                  getEventColor()
                )}
              >
                {getEventIcon()}
                <span className="truncate hidden sm:inline">{event.title}</span>
                <span className="truncate sm:hidden">{event.title.slice(0, 6)}...</span>
              </div>
            ))}
            {events.length > 2 && (
              <div className="text-[10px] sm:text-xs text-gray-500">
                +{events.length - 2}
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{translations.calendarTitle || "Calendar"}</CardTitle>
              <CardDescription className="text-sm">
                {translations.calendarDescription ||
                  "Track events and important dates"}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2 self-stretch sm:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("prev")}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm sm:text-base font-semibold min-w-[120px] text-center">
                {monthNames[month]} {year}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth("next")}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="grid grid-cols-7 gap-0 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500 border-b"
              >
                {day.slice(0, 1)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0">{renderCalendarDays()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl">{translations.eventsTitle || "Events"}</CardTitle>
          <CardDescription className="text-sm">
            {selectedDate
              ? `${translations.eventsFor || "Events for"} ${new Date(
                  selectedDate
                ).toLocaleDateString(translations.locale || "en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}`
              : translations.selectDateToViewEvents ||
                "Select a date to view events"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          {selectedEvents.length > 0 ? (
            <div className="space-y-3">
              {selectedEvents.map((event) => (
                <div key={event.id} className="space-y-2 p-2 sm:p-3 rounded-lg border">
                  <div className="flex items-start sm:items-center gap-2">
                    <div className={cn("p-1.5 sm:p-2 rounded-full shrink-0", getEventColor())}>
                      {getEventIcon()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-sm sm:text-base truncate">{event.title}</h4>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">{formatTime(event.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                      <span className="truncate">
                        {translations.createdBy || "Created by"}:{" "}
                        {event.members?.name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4 text-sm">
              {selectedDate
                ? translations.noEventsScheduled || "No events scheduled"
                : translations.selectDateToViewEvents ||
                  "Select a date to view events"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
