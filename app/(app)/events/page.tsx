"use client";

import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CalendarWidget } from "@/components/calendar-widget";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, MapPin, User } from "lucide-react";
import { CalendarIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { parseDate } from "chrono-node";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";

const supabase = createClient();

interface Member {
  id: string;
  name: string;
  avatar?: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  created_by: string;
  created_at: string;
  members?: Member;
}

export default function CalendarPage() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMemberList, setShowMemberList] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    created_by: "",
  });
  const [eventDateInputValue, setEventDateInputValue] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState<Date | undefined>(
    undefined
  );

  useEffect(() => {
    fetchMembers();
    fetchEvents();
  }, []);

  async function fetchEvents() {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          *,
          members:created_by (
            id,
            name,
            avatar
          )
        `
        )
        .order("event_date", { ascending: true });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!data) {
        console.error("No data returned from events table");
        throw new Error("No data returned");
      }

      console.log("Fetched events:", data);
      setEvents(data);
    } catch (error: any) {
      console.error("Error fetching events:", error?.message || error);
      toast.error(
        `Failed to load events: ${error?.message || "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchMembers() {
    try {
      const { data, error } = await supabase
        .from("members")
        .select("id, name, avatar")
        .order("name");

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!data) {
        console.error("No data returned from members table");
        throw new Error("No data returned");
      }

      console.log("Fetched members:", data);
      setMembers(data);
    } catch (error: any) {
      console.error("Error fetching members:", error?.message || error);
      toast.error(
        `Failed to load members: ${error?.message || "Unknown error"}`
      );
    }
  }

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMemberSelect = (member: Member) => {
    setFormData({ ...formData, created_by: member.id });
    setSearchQuery(member.name);
    setShowMemberList(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.created_by) {
        toast.error("Please select a member");
        return;
      }

      if (
        !formData.title ||
        !formData.description ||
        !eventDate ||
        !formData.location
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      const { error } = await supabase.from("events").insert({
        title: formData.title,
        description: formData.description,
        event_date: eventDate.toISOString().split("T")[0],
        location: formData.location,
        created_by: formData.created_by,
      });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      toast.success("Event created successfully");
      setOpen(false);
      setFormData({
        title: "",
        description: "",
        event_date: "",
        location: "",
        created_by: "",
      });
      setSearchQuery("");
      // Refresh events list
      fetchEvents();
    } catch (error: any) {
      console.error("Error creating event:", error);
      toast.error(
        `Failed to create event: ${error?.message || "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col">
        <div className="flex-1 p-4 md:p-8">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-10 w-[120px]" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-0 mb-2">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="p-2 text-center">
                      <Skeleton className="h-4 w-8 mx-auto" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0">
                  {[...Array(35)].map((_, i) => (
                    <div key={i} className="h-24 p-1 border border-gray-100">
                      <Skeleton className="h-4 w-6 mb-1" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-3 p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-5 w-32 mb-2" />
                          <Skeleton className="h-4 w-48" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 p-4 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Event Creator</label>
                  <p className="text-sm text-muted-foreground">
                    Select the member who is creating this event
                  </p>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search member name..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowMemberList(true);
                      }}
                      onFocus={() => setShowMemberList(true)}
                    />
                    {showMemberList && searchQuery && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border">
                        <div className="max-h-60 overflow-auto">
                          {filteredMembers.length > 0 ? (
                            filteredMembers.map((member) => (
                              <div
                                key={member.id}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                                onClick={() => handleMemberSelect(member)}
                              >
                                <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                                  {member.avatar ? (
                                    <img
                                      src={member.avatar}
                                      alt={member.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium">
                                      {member.name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span className="truncate">{member.name}</span>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-gray-500">
                              No members found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="event_date" className="text-sm font-medium">
                    Event Date
                  </label>
                  <div className="relative flex gap-2">
                    <Input
                      id="event_date"
                      value={eventDateInputValue}
                      placeholder="Tomorrow or next week"
                      className="bg-background pr-10"
                      onChange={(e) => {
                        setEventDateInputValue(e.target.value);
                        const parsed = parseDate(e.target.value);
                        if (parsed) {
                          setEventDate(parsed);
                          setCalendarMonth(parsed);
                        } else {
                          setEventDate(undefined);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          // No need to open popover here, as it's handled by PopoverTrigger
                        }
                      }}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="date-picker"
                          variant="ghost"
                          className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                        >
                          <CalendarIcon className="size-3.5" />
                          <span className="sr-only">Select date</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="end"
                      >
                        <Calendar
                          mode="single"
                          selected={eventDate}
                          captionLayout="dropdown"
                          month={calendarMonth}
                          onMonthChange={setCalendarMonth}
                          onSelect={(date) => {
                            setEventDate(date);
                            setEventDateInputValue(
                              date ? format(date, "PPP") : ""
                            );
                            // Close the popover if needed, Popover handles it
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="text-muted-foreground px-1 text-sm">
                    Your event will be scheduled for{" "}
                    <span className="font-medium">
                      {eventDate ? format(eventDate, "PPP") : "a selected date"}
                    </span>
                    .
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">
                    Location
                  </label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Event"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <CalendarWidget events={events} />
      </div>
    </div>
  );
}
