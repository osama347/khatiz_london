"use client";

import { useEffect, useState, use, useMemo, useCallback } from "react";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, Eye, Users } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { LoadingSpinner, TableSkeleton } from "@/components/loading";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { ImageUpload } from "@/components/ui/image-upload";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
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

interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  date_of_birth?: string;
  join_date: string;
  created_at: string;
  status: "Active" | "Inactive" | "Suspended";
  avatar?: string;
  current_address?: string;
  back_home_address?: string;
  family_members?: any;
  emergency_contact_number?: string;
  role?: string;
}

const supabase = createClient();

// Memoized utility functions
const transformAvatarUrl = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  if (url.startsWith("http")) return url;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${url}`;
};

const toLondonTime = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
};

const toUTC = (date: Date | string): Date => {
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
};

export default function MembersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = use(params);
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalMembers, setTotalMembers] = useState(0);
  const [translations, setTranslations] = useState<any>({});
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    email: string;
    join_date: string;
    date_of_birth: string;
    status: "Active" | "Inactive" | "Suspended";
    avatar: string | undefined;
    current_address: string;
    back_home_address: string;
    family_members: string;
    emergency_contact_number: string;
    role: string;
  }>({
    name: "",
    phone: "",
    email: "",
    join_date: "",
    date_of_birth: "",
    status: "Active",
    avatar: "",
    current_address: "",
    back_home_address: "",
    family_members: "",
    emergency_contact_number: "",
    role: "",
  });

  // Load translations
  useEffect(() => {
    getTranslations(resolvedParams.locale).then(setTranslations);
  }, [resolvedParams.locale]);

  // Debounced search
  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        const filtered = members.filter(
          (member) =>
            member.name.toLowerCase().includes(term.toLowerCase()) ||
            member.email.toLowerCase().includes(term.toLowerCase()) ||
            member.phone.includes(term)
        );
        setFilteredMembers(filtered);
        setCurrentPage(1);
      }, 300),
    [members]
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  // Load members with parallel data fetching
  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);

      const [membersResult, countResult] = await Promise.all([
        supabase
          .from("members")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase.from("members").select("*", { count: "exact", head: true }),
      ]);

      if (membersResult.data) {
        setMembers(membersResult.data);
        setFilteredMembers(membersResult.data);
      }

      if (countResult.count !== null) {
        setTotalMembers(countResult.count);
      }
    } catch (error) {
      console.error("Error loading members:", error);
      toast.error(translations.failedToLoadMembers || "Failed to load members");
    } finally {
      setLoading(false);
    }
  }, [translations.failedToLoadMembers]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Memoized pagination
  const getCurrentPageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredMembers.slice(startIndex, endIndex);
  }, [filteredMembers, currentPage, pageSize]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const getPageNumbers = useMemo(() => {
    const totalPages = Math.ceil(filteredMembers.length / pageSize);
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  }, [filteredMembers.length, pageSize, currentPage]);

  const handleDeleteMember = useCallback(async (member: Member) => {
    setSelectedMember(member);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!selectedMember) return;

    try {
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", selectedMember.id);

      if (error) throw error;

      toast.success(
        translations.memberDeletedSuccessfully || "Member deleted successfully"
      );
      setIsDeleteDialogOpen(false);
      setSelectedMember(null);
      loadMembers();
    } catch (error) {
      console.error("Error deleting member:", error);
      toast.error(
        translations.failedToDeleteMember || "Failed to delete member"
      );
    }
  }, [selectedMember, translations, loadMembers]);

  const handleEditMember = useCallback((member: Member) => {
    setSelectedMember(member);
    setFormData({
      name: member.name,
      phone: member.phone,
      email: member.email,
      join_date: format(toLondonTime(member.join_date), "yyyy-MM-dd"),
      date_of_birth: member.date_of_birth || "",
      status: member.status as "Active" | "Inactive" | "Suspended",
      avatar: member.avatar || "",
      current_address: member.current_address || "",
      back_home_address: member.back_home_address || "",
      family_members: member.family_members
        ? JSON.stringify(member.family_members, null, 2)
        : "",
      emergency_contact_number: member.emergency_contact_number || "",
      role: member.role || "",
    });
    setIsEditDialogOpen(true);
  }, []);

  const handleUpdateMember = useCallback(async () => {
    if (!selectedMember) return;

    try {
      const memberDataToUpdate = {
        ...formData,
        join_date: toUTC(formData.join_date).toISOString(),
        family_members: formData.family_members
          ? JSON.parse(formData.family_members)
          : null,
      };

      const { error: updateError } = await supabase
        .from("members")
        .update(memberDataToUpdate)
        .eq("id", selectedMember.id);

      if (updateError) throw updateError;

      toast.success(
        translations.memberUpdatedSuccessfully || "Member updated successfully"
      );
      setIsEditDialogOpen(false);
      setSelectedMember(null);
      setFormData({
        name: "",
        phone: "",
        email: "",
        join_date: "",
        date_of_birth: "",
        status: "Active",
        avatar: "",
        current_address: "",
        back_home_address: "",
        family_members: "",
        emergency_contact_number: "",
        role: "",
      });
      loadMembers();
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error(
        translations.failedToUpdateMember || "Failed to update member"
      );
    }
  }, [formData, selectedMember, translations, loadMembers]);

  // Memoized utility components
  const getStatusBadge = useCallback(
    (status: string) => {
      const statusConfig = {
        Active: {
          color: "bg-green-100 text-green-800",
          text: translations.active || "Active",
        },
        Inactive: {
          color: "bg-gray-100 text-gray-800",
          text: translations.inactive || "Inactive",
        },
        Suspended: {
          color: "bg-red-100 text-red-800",
          text: translations.suspended || "Suspended",
        },
      };

      const config =
        statusConfig[status as keyof typeof statusConfig] ||
        statusConfig.Active;

      return (
        <Badge className={cn("text-xs", config.color)}>{config.text}</Badge>
      );
    },
    [translations]
  );

  const getInitials = useCallback((name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  const MemberAvatar = useCallback(
    ({ name, avatar }: { name: string; avatar?: string }) => {
      if (avatar) {
        return (
          <Image
            src={transformAvatarUrl(avatar)}
            alt={name}
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
        );
      }

      return (
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
          {getInitials(name)}
        </div>
      );
    },
    [getInitials]
  );

  if (loading) {
    return (
      <div className="flex flex-col">
        <div className="flex-1 space-y-4 p-4 md:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-[300px]" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <TableSkeleton rows={10} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Input
              placeholder={translations.searchMembers || "Search members..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[300px]"
            />
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {translations.communityMembers || "Community Members"}
            </CardTitle>
            <CardDescription>
              {translations.manageMembers ||
                "Manage all community members and their information"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {translations.noMembersFound || "No members found"}
                </h3>
                <p className="text-muted-foreground">
                  {translations.getStartedByAdding ||
                    "Get started by adding your first community member"}
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{translations.name || "Name"}</TableHead>
                      <TableHead>{translations.phone || "Phone"}</TableHead>
                      <TableHead>{translations.email || "Email"}</TableHead>
                      <TableHead>
                        {translations.joiningDate || "Joining Date"}
                      </TableHead>
                      <TableHead>{translations.status || "Status"}</TableHead>
                      <TableHead>{translations.role || "Role"}</TableHead>
                      <TableHead>
                        {translations.currentAddress || "Current Address"}
                      </TableHead>
                      <TableHead>
                        {translations.emergencyContact || "Emergency Contact"}
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCurrentPageItems.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="flex items-center gap-3">
                          <MemberAvatar
                            name={member.name}
                            avatar={member.avatar}
                          />
                          <span className="font-medium">{member.name}</span>
                        </TableCell>
                        <TableCell>{member.phone}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          {format(
                            toLondonTime(member.join_date),
                            "MMM d, yyyy"
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>{member.current_address}</TableCell>
                        <TableCell>{member.emergency_contact_number}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/${resolvedParams.locale}/member/${member.id}`}
                            >
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditMember(member)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMember(member)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between space-x-2 py-4">
                  <div className="text-sm text-muted-foreground">
                    {translations.showing || "Showing"}{" "}
                    {Math.min(
                      (currentPage - 1) * pageSize + 1,
                      filteredMembers.length
                    )}{" "}
                    {translations.to || "to"}{" "}
                    {Math.min(currentPage * pageSize, filteredMembers.length)}{" "}
                    {translations.of || "of"} {filteredMembers.length}{" "}
                    {translations.entries || "entries"}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      {translations.first || "First"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      {translations.previous || "Previous"}
                    </Button>
                    {getPageNumbers.map((page, index) => (
                      <Button
                        key={index}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() =>
                          typeof page === "number" && handlePageChange(page)
                        }
                        disabled={page === "..."}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={
                        currentPage ===
                        Math.ceil(filteredMembers.length / pageSize)
                      }
                    >
                      {translations.next || "Next"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handlePageChange(
                          Math.ceil(filteredMembers.length / pageSize)
                        )
                      }
                      disabled={
                        currentPage ===
                        Math.ceil(filteredMembers.length / pageSize)
                      }
                    >
                      {translations.last || "Last"}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {translations.editMember || "Edit Member"}
            </DialogTitle>
            <DialogDescription>
              {translations.updateMemberInfo ||
                "Update the member's information."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-avatar">
                {translations.profilePicture || "Profile Picture"}
              </Label>
              <ImageUpload
                value={formData.avatar || ""}
                onChange={(value) =>
                  setFormData({ ...formData, avatar: value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">
                {translations.nameRequired || "Name *"}
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={translations.enterFullName || "Enter full name"}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">
                {translations.phoneRequired || "Phone *"}
              </Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder={
                  translations.enterPhoneNumber || "Enter phone number"
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">
                {translations.emailRequired || "Email *"}
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder={
                  translations.enterEmailAddress || "Enter email address"
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-join_date">
                {translations.joiningDateRequired || "Joining Date *"}
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.join_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.join_date
                      ? format(new Date(formData.join_date), "PPP")
                      : translations.pickADate || "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      formData.join_date
                        ? new Date(formData.join_date)
                        : undefined
                    }
                    onSelect={(date) =>
                      setFormData({
                        ...formData,
                        join_date: date ? format(date, "yyyy-MM-dd") : "",
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">
                {translations.status || "Status"}
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    status: value as "Active" | "Inactive" | "Suspended",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={translations.selectStatus || "Select status"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">
                    {translations.active || "Active"}
                  </SelectItem>
                  <SelectItem value="Inactive">
                    {translations.inactive || "Inactive"}
                  </SelectItem>
                  <SelectItem value="Suspended">
                    {translations.suspended || "Suspended"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-date_of_birth">Date of Birth</Label>
              <Input
                id="edit-date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) =>
                  setFormData({ ...formData, date_of_birth: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-current_address">Current Address</Label>
              <Input
                id="edit-current_address"
                value={formData.current_address}
                onChange={(e) =>
                  setFormData({ ...formData, current_address: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-back_home_address">Back Home Address</Label>
              <Input
                id="edit-back_home_address"
                value={formData.back_home_address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    back_home_address: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-emergency_contact_number">
                Emergency Contact Number
              </Label>
              <Input
                id="edit-emergency_contact_number"
                value={formData.emergency_contact_number}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emergency_contact_number: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-family_members">Family Members (JSON)</Label>
              <textarea
                id="edit-family_members"
                value={formData.family_members}
                onChange={(e) =>
                  setFormData({ ...formData, family_members: e.target.value })
                }
                className="border rounded p-2"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Input
                id="edit-role"
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateMember}>
              {translations.updatingMember || "Updating Member..."}
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
                "This action cannot be undone. This will permanently delete the member"}
              {selectedMember?.name && ` "${selectedMember.name}"`}
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
