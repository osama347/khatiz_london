"use client";

import { useEffect, useState, use, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { LoadingSpinner, TableSkeleton } from "@/components/loading";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn, debounce } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { getTranslations } from "@/lib/translations";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarWidget } from "@/components/calendar-widget";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchEvents } from "@/lib/server/events";
import useSWR from "swr";
import { fetchMemberByEmail } from "@/lib/server/members";
import { useRouter } from "next/navigation";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  created_at: string;
  created_by?: string;
}

const supabase = createClient();

export default function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = use(params);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [translations, setTranslations] = useState<any>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [members, setMembers] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    created_by: "",
  });
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<
    { id: string; name: string; avatar?: string }[]
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<{
    id: string;
    name: string;
    avatar?: string;
  } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // Load translations
  useEffect(() => {
    getTranslations(resolvedParams.locale).then(setTranslations);
  }, [resolvedParams.locale]);

  // SWR data fetching for events
  const {
    data: eventsData,
    error,
    isValidating,
  } = useSWR(
    ["events", searchTerm, currentPage, pageSize],
    () => fetchEvents({ searchTerm, page: currentPage, pageSize }),
    {
      keepPreviousData: true,
    }
  );

  const events = eventsData?.data || [];
  const totalEvents = eventsData?.count || 0;
  const loading = isValidating && !eventsData;

  // Fetch members for creator select
  useEffect(() => {
    supabase
      .from("members")
      .select("id, name, email")
      .then((res: { data: any[] | null }) => {
        if (res.data)
          setMembers(res.data as { id: string; name: string; email: string }[]);
      });
  }, []);

  // Member search effect
  useEffect(() => {
    if (memberSearch.length < 2) {
      setMemberResults([]);
      return;
    }
    setSearchLoading(true);
    supabase
      .from("members")
      .select("id, name, avatar")
      .ilike("name", `%${memberSearch}%`)
      .then((res: { data: any[] | null }) => {
        setSearchLoading(false);
        if (res.data)
          setMemberResults(
            res.data as { id: string; name: string; avatar?: string }[]
          );
      });
  }, [memberSearch]);

  // Memoized pagination
  const getCurrentPageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return events.slice(startIndex, endIndex);
  }, [events, currentPage, pageSize]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // Memoized event operations
  const handleAddEvent = useCallback(async () => {
    try {
      const { error } = await supabase.from("events").insert([
        {
          ...formData,
          event_date: new Date(formData.event_date).toISOString(),
        },
      ]);

      if (error) throw error;

      toast.success(
        translations.eventAddedSuccessfully || "Event added successfully"
      );
      setIsAddDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        event_date: "",
        location: "",
        created_by: "",
      });
      // No need to call loadEvents here, SWR will revalidate
    } catch (error) {
      console.error("Error adding event:", error);
      toast.error(translations.failedToAddEvent || "Failed to add event");
    }
  }, [formData, translations]);

  const handleDeleteEvent = useCallback(async (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!selectedEvent) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", selectedEvent.id);

      if (error) throw error;

      toast.success(
        translations.eventDeletedSuccessfully || "Event deleted successfully"
      );
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
      // No need to call loadEvents here, SWR will revalidate
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error(translations.failedToDeleteEvent || "Failed to delete event");
    }
  }, [selectedEvent, translations]);

  const handleEditEvent = useCallback((event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      event_date: format(new Date(event.event_date), "yyyy-MM-dd"),
      location: event.location,
      created_by: event.created_by || "",
    });
    setIsEditDialogOpen(true);
  }, []);

  const handleUpdateEvent = useCallback(async () => {
    if (!selectedEvent) return;

    try {
      const { error } = await supabase
        .from("events")
        .update({
          ...formData,
          event_date: new Date(formData.event_date).toISOString(),
        })
        .eq("id", selectedEvent.id);

      if (error) throw error;

      toast.success(
        translations.eventUpdatedSuccessfully || "Event updated successfully"
      );
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      setFormData({
        title: "",
        description: "",
        event_date: "",
        location: "",
        created_by: "",
      });
      // No need to call loadEvents here, SWR will revalidate
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error(translations.failedToUpdateEvent || "Failed to update event");
    }
  }, [formData, selectedEvent, translations]);

  // Memoized utility functions
  const getEventStatus = useCallback((eventDate: string) => {
    const now = new Date();
    const eventDateObj = new Date(eventDate);

    if (eventDateObj < now) {
      return { status: "Past", color: "bg-gray-100 text-gray-800" };
    } else if (eventDateObj.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return { status: "Today", color: "bg-red-100 text-red-800" };
    } else {
      return { status: "Upcoming", color: "bg-green-100 text-green-800" };
    }
  }, []);

  useEffect(() => {
    async function getUserId() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) setUserId(data.user.id);
    }
    getUserId();
  }, []);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  useEffect(() => {
    async function getUserEmail() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) setUserEmail(data.user.email);
    }
    getUserEmail();
  }, []);
  const { data: member, isLoading } = useSWR(
    userEmail ? ["member", userEmail] : null,
    () => fetchMemberByEmail(userEmail!)
  );
  useEffect(() => {
    if (!isLoading && member && member.role !== "admin") {
      router.replace("/profile");
    }
  }, [isLoading, member, router]);
  if (isLoading || !userEmail || (member && member.role !== "admin")) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <div className="flex-1 space-y-4 p-4 md:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-[300px] bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <TableSkeleton rows={10} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex justify-end mb-4">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {translations.addEvent || "Add Event"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {translations.addNewEvent || "Add New Event"}
                </DialogTitle>
                <DialogDescription>
                  {translations.enterEventDetails ||
                    "Enter the details of the new event."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="created_by">
                    {translations.createdBy || "Created by"}
                  </Label>
                  {selectedCreator ? (
                    <div className="flex items-center gap-2 border rounded p-2">
                      <Avatar className="h-6 w-6">
                        {selectedCreator.avatar ? (
                          <AvatarImage
                            src={selectedCreator.avatar}
                            alt={selectedCreator.name}
                          />
                        ) : (
                          <AvatarFallback>
                            {selectedCreator.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span>{selectedCreator.name}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedCreator(null);
                          setFormData({ ...formData, created_by: "" });
                        }}
                      >
                        x
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder={
                          translations.selectCreator ||
                          "Search event creator by name"
                        }
                        autoComplete="off"
                      />
                      {searchLoading && (
                        <div className="absolute right-2 top-2 text-xs">
                          ...
                        </div>
                      )}
                      {memberResults.length > 0 && (
                        <div className="absolute z-10 bg-white border rounded w-full mt-1 max-h-48 overflow-auto shadow">
                          {memberResults.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setSelectedCreator(member);
                                setFormData({
                                  ...formData,
                                  created_by: member.id,
                                });
                                setMemberSearch("");
                                setMemberResults([]);
                              }}
                            >
                              <Avatar className="h-6 w-6">
                                {member.avatar ? (
                                  <AvatarImage
                                    src={member.avatar}
                                    alt={member.name}
                                  />
                                ) : (
                                  <AvatarFallback>
                                    {member.name.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <span>{member.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">
                    {translations.title || "Title *"}
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder={
                      translations.enterEventTitle || "Enter event title"
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">
                    {translations.description || "Description"}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder={
                      translations.enterEventDescription ||
                      "Enter event description"
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="event_date">
                    {translations.eventDate || "Event Date *"}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.event_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.event_date
                          ? format(new Date(formData.event_date), "PPP")
                          : translations.pickADate || "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={
                          formData.event_date
                            ? new Date(formData.event_date)
                            : undefined
                        }
                        onSelect={(date) =>
                          setFormData({
                            ...formData,
                            event_date: date ? format(date, "yyyy-MM-dd") : "",
                          })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">
                    {translations.location || "Location *"}
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder={
                      translations.enterEventLocation || "Enter event location"
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddEvent}>
                  {translations.addEvent || "Add Event"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <CalendarWidget
          events={events.map((e) => ({
            ...e,
            created_by: (e as any).created_by || "",
          }))}
          translations={translations}
        />
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{translations.editEvent || "Edit Event"}</DialogTitle>
            <DialogDescription>
              {translations.updateEventInfo ||
                "Update the event's information."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">
                {translations.title || "Title *"}
              </Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder={
                  translations.enterEventTitle || "Enter event title"
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">
                {translations.description || "Description"}
              </Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={
                  translations.enterEventDescription ||
                  "Enter event description"
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-event_date">
                {translations.eventDate || "Event Date *"}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.event_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.event_date
                      ? format(new Date(formData.event_date), "PPP")
                      : translations.pickADate || "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={
                      formData.event_date
                        ? new Date(formData.event_date)
                        : undefined
                    }
                    onSelect={(date) =>
                      setFormData({
                        ...formData,
                        event_date: date ? format(date, "yyyy-MM-dd") : "",
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">
                {translations.location || "Location *"}
              </Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder={
                  translations.enterEventLocation || "Enter event location"
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateEvent}>
              {translations.updatingEvent || "Updating Event..."}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {translations.areYouSure || "Are you sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {translations.deleteWarning ||
                "This action cannot be undone. This will permanently delete the event"}
              {selectedEvent?.title && ` "${selectedEvent.title}"`}
              {translations.andRemoveData ||
                " and remove their data from our servers."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {translations.cancel || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {translations.deleting || "Deleting..."}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
