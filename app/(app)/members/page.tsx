"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
import LoadingSkeleton from "@/components/loading";
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
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  date_of_birth?: string;
  join_date: string;
  status: "Active" | "Inactive" | "Suspended";
  avatar?: string;
}

const supabase = createClient();

async function fetchMembers() {
  try {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return { members: data || [] };
  } catch (error: any) {
    console.error("Error fetching members:", error);
    return { error: error.message };
  }
}

// Utility function to transform avatar URLs
function transformAvatarUrl(url: string): string {
  // If it's a Supabase storage URL, you can add transformations
  if (
    url.startsWith(
      "https://lgqztytyzjziuppwfgvj.supabase.co/storage/v1/object/public/"
    )
  ) {
    // Example: Add resizing or format conversion
    return `${url}?width=80&height=80&quality=80`;
  }
  return url;
}

// Helper function to convert UTC to London time
function toLondonTime(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
}

// Helper function to convert London time to UTC
function toUTC(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<Boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  async function loadMembers() {
    setLoading(true);
    const result = await fetchMembers();
    if ("error" in result) {
      setError(result.error || null);
    } else {
      setMembers(result.members);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
  }, []);

  // Verify storage bucket exists and is accessible

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [newMember, setNewMember] = useState<{
    name: string;
    phone: string;
    email: string;
    join_date: string;
    status: "Active" | "Inactive" | "Suspended";
    avatar: string;
  }>({
    name: "",
    phone: "",
    email: "",
    join_date: new Date().toISOString().split("T")[0],
    status: "Active",
    avatar: "",
  });

  const filteredMembers = (members || []).filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm)
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredMembers.length / pageSize);

  // Get current page items
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredMembers.slice(startIndex, endIndex);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of visible pages
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if at the start
      if (currentPage <= 2) {
        end = 4;
      }
      // Adjust if at the end
      if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push(-1); // -1 represents ellipsis
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push(-2); // -2 represents ellipsis
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const handleAddMember = async () => {
    if (
      !newMember.name ||
      !newMember.phone ||
      !newMember.email ||
      !newMember.join_date
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      let avatarUrl = null;

      // If there's an avatar (base64 string), upload it to Supabase storage
      if (newMember.avatar) {
        try {
          const base64Data = newMember.avatar.split(",")[1];
          const fileExt = newMember.avatar.split(";")[0].split("/")[1];
          const fileName = `${Date.now()}.${fileExt}`;

          console.log("Uploading avatar:", {
            fileName,
            fileExt,
            base64Length: base64Data.length,
          });

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("avatars")
              .upload(fileName, decodeBase64(base64Data), {
                contentType: `image/${fileExt}`,
                upsert: true,
              });

          if (uploadError) {
            console.error("Avatar upload error:", uploadError);
            throw new Error(`Failed to upload avatar: ${uploadError.message}`);
          }

          console.log("Avatar uploaded successfully:", uploadData);

          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(fileName);

          console.log("Avatar public URL:", publicUrl);
          avatarUrl = publicUrl;
        } catch (uploadError: any) {
          console.error("Avatar upload process error:", uploadError);
          throw new Error(`Avatar upload failed: ${uploadError.message}`);
        }
      }

      // Prepare the member data in the correct order
      const memberData = {
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone,
        date_of_birth: null, // Optional field
        join_date: toUTC(newMember.join_date).toISOString().split("T")[0],
        created_at: new Date().toISOString(),
        status: newMember.status,
        avatar: avatarUrl,
      };

      console.log("Inserting member data:", memberData);

      // Insert the new member into the database
      const { data, error: insertError } = await supabase
        .from("members")
        .insert([memberData])
        .select()
        .single();

      if (insertError) {
        console.error("Insert error details:", insertError);
        throw new Error(`Failed to add member: ${insertError.message}`);
      }

      if (!data) {
        throw new Error("No data returned after insert");
      }

      // Update the local state with the new member
      setMembers([...members, data]);

      // Reset the form
      setNewMember({
        name: "",
        phone: "",
        email: "",
        join_date: new Date().toISOString().split("T")[0],
        status: "Active",
        avatar: "",
      });
      setIsAddDialogOpen(false);

      toast("Member added successfully", {
        description: (
          <span className="text-foreground">Member ID: {data.id}</span>
        ),
      });
    } catch (error: any) {
      console.error("Error adding member:", error);
      toast.error(error.message || "Failed to add member. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to decode base64 string
  function decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "Inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "Suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Utility function to get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  // Avatar component with initials fallback
  const MemberAvatar = ({
    name,
    avatar,
  }: {
    name: string;
    avatar?: string;
  }) => {
    // Validate and clean avatar URL
    const validAvatar =
      avatar && avatar.trim() !== ""
        ? avatar.startsWith("http")
          ? avatar
          : `https://lgqztytyzjziuppwfgvj.supabase.co/storage/v1/object/public/avatars/${avatar}`
        : null;

    return (
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-100 relative">
          {validAvatar ? (
            <Image
              src={validAvatar}
              alt={`${name}'s avatar`}
              fill
              sizes="(max-width: 768px) 2.5rem, 2.5rem"
              className="object-cover object-center"
              priority={false}
              placeholder="empty"
              onError={(e) => {
                console.warn(`Failed to load avatar for ${name}`, e);
              }}
            />
          ) : (
            <span className="text-xs font-medium text-gray-600 flex items-center justify-center w-full h-full">
              {getInitials(name)}
            </span>
          )}
        </div>
      </div>
    );
  };

  const handleDeleteMember = async (member: Member) => {
    setMemberToDelete(member);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;

    setIsDeleting(true);
    try {
      // Delete the member's avatar from storage if it exists
      if (memberToDelete.avatar) {
        try {
          const avatarPath = memberToDelete.avatar.split("/").pop();
          if (avatarPath) {
            const { error: storageError } = await supabase.storage
              .from("avatars")
              .remove([avatarPath]);

            if (storageError) {
              console.error("Error deleting avatar:", storageError);
              // Continue with member deletion even if avatar deletion fails
            }
          }
        } catch (error) {
          console.error("Error processing avatar deletion:", error);
        }
      }

      // Delete the member from the database
      const { error: deleteError } = await supabase
        .from("members")
        .delete()
        .eq("id", memberToDelete.id);

      if (deleteError) {
        throw new Error(`Failed to delete member: ${deleteError.message}`);
      }

      // Update the local state
      setMembers(members.filter((m) => m.id !== memberToDelete.id));

      toast("Member deleted successfully", {
        description: (
          <span className="text-foreground">
            Member {memberToDelete.name} has been removed
          </span>
        ),
      });
    } catch (error: any) {
      console.error("Error deleting member:", error);
      toast.error(
        error.message || "Failed to delete member. Please try again."
      );
    } finally {
      setIsDeleting(false);
      setMemberToDelete(null);
    }
  };

  const handleEditMember = (member: Member) => {
    setMemberToEdit(member);
    setIsEditing(true);
  };

  const handleUpdateMember = async () => {
    if (!memberToEdit) return;

    if (
      !memberToEdit.name ||
      !memberToEdit.phone ||
      !memberToEdit.email ||
      !memberToEdit.join_date
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      let avatarUrl = memberToEdit.avatar;

      // If there's a new avatar (base64 string), upload it to Supabase storage
      if (memberToEdit.avatar && memberToEdit.avatar.startsWith("data:")) {
        try {
          const base64Data = memberToEdit.avatar.split(",")[1];
          const fileExt = memberToEdit.avatar.split(";")[0].split("/")[1];
          const fileName = `${Date.now()}.${fileExt}`;

          // Delete old avatar if it exists
          if (memberToEdit.avatar && !memberToEdit.avatar.startsWith("data:")) {
            const oldAvatarPath = memberToEdit.avatar.split("/").pop();
            if (oldAvatarPath) {
              await supabase.storage.from("avatars").remove([oldAvatarPath]);
            }
          }

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("avatars")
              .upload(fileName, decodeBase64(base64Data), {
                contentType: `image/${fileExt}`,
                upsert: true,
              });

          if (uploadError) {
            throw new Error(`Failed to upload avatar: ${uploadError.message}`);
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(fileName);

          avatarUrl = publicUrl;
        } catch (uploadError: any) {
          console.error("Avatar upload process error:", uploadError);
          throw new Error(`Avatar upload failed: ${uploadError.message}`);
        }
      }

      // Prepare the member data
      const memberData = {
        name: memberToEdit.name,
        email: memberToEdit.email,
        phone: memberToEdit.phone,
        date_of_birth: memberToEdit.date_of_birth,
        join_date: toUTC(memberToEdit.join_date).toISOString().split("T")[0],
        status: memberToEdit.status,
        avatar: avatarUrl,
      };

      // Update the member in the database
      const { data, error: updateError } = await supabase
        .from("members")
        .update(memberData)
        .eq("id", memberToEdit.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update member: ${updateError.message}`);
      }

      // Update the local state
      setMembers(members.map((m) => (m.id === memberToEdit.id ? data : m)));

      toast("Member updated successfully", {
        description: (
          <span className="text-foreground">
            Member {memberToEdit.name} has been updated
          </span>
        ),
      });

      setIsEditing(false);
      setMemberToEdit(null);
    } catch (error: any) {
      console.error("Error updating member:", error);
      toast.error(
        error.message || "Failed to update member. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-4 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[300px]"
              />
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Enter the details of the new community member.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <Label>Profile Picture</Label>
                    <div className="mt-2">
                      <ImageUpload
                        value={newMember.avatar || undefined}
                        onChange={(value) =>
                          setNewMember({ ...newMember, avatar: value || "" })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="name" className="mb-2">
                      Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter full name"
                      value={newMember.name}
                      onChange={(e) =>
                        setNewMember({ ...newMember, name: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="mb-2">
                      Phone *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={newMember.phone}
                      onChange={(e) =>
                        setNewMember({ ...newMember, phone: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="mb-2">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email address"
                      value={newMember.email}
                      onChange={(e) =>
                        setNewMember({ ...newMember, email: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="join_date" className="mb-2">
                      Joining Date *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !newMember.join_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newMember.join_date ? (
                            format(toLondonTime(newMember.join_date), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            newMember.join_date
                              ? toLondonTime(newMember.join_date)
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              setNewMember({
                                ...newMember,
                                join_date: toUTC(date)
                                  .toISOString()
                                  .split("T")[0],
                              });
                            }
                          }}
                          captionLayout="dropdown"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="status" className="mb-2">
                      Status
                    </Label>
                    <Select
                      value={newMember.status}
                      onValueChange={(
                        value: "Active" | "Inactive" | "Suspended"
                      ) => setNewMember({ ...newMember, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={handleAddMember}
                  disabled={
                    isSubmitting ||
                    !newMember.name ||
                    !newMember.phone ||
                    !newMember.email ||
                    !newMember.join_date
                  }
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Adding Member...
                    </>
                  ) : (
                    "Add Member"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Community Members</CardTitle>
            <CardDescription>
              Manage all community members and their information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile Picture</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joining Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getCurrentPageItems().length > 0 ? (
                  getCurrentPageItems().map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <MemberAvatar
                          name={member.name}
                          avatar={member.avatar}
                        />
                      </TableCell>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        {format(toLondonTime(member.join_date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/member/${member.id}`}>
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-medium">No members found</p>
                        <p className="text-sm text-muted-foreground">
                          Get started by adding your first community member
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddDialogOpen(true)}
                          className="mt-2"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Member
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  {Math.min(
                    (currentPage - 1) * pageSize + 1,
                    filteredMembers.length
                  )}{" "}
                  to {Math.min(currentPage * pageSize, filteredMembers.length)}{" "}
                  of {filteredMembers.length} entries
                </p>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => handlePageSizeChange(Number(value))}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((page, index) =>
                    page < 0 ? (
                      <span key={`ellipsis-${index}`} className="px-2">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="w-8 h-8"
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Member Dialog */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Member</DialogTitle>
              <DialogDescription>
                Update the member's information.
              </DialogDescription>
            </DialogHeader>
            {memberToEdit && (
              <div className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="flex-shrink-0">
                    <Label>Profile Picture</Label>
                    <div className="mt-2">
                      <ImageUpload
                        value={memberToEdit.avatar || undefined}
                        onChange={(value) =>
                          setMemberToEdit({
                            ...memberToEdit,
                            avatar: value || "",
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="edit-name" className="mb-2">
                      Name *
                    </Label>
                    <Input
                      id="edit-name"
                      placeholder="Enter full name"
                      value={memberToEdit.name}
                      onChange={(e) =>
                        setMemberToEdit({
                          ...memberToEdit,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-phone" className="mb-2">
                      Phone *
                    </Label>
                    <Input
                      id="edit-phone"
                      type="tel"
                      placeholder="Enter phone number"
                      value={memberToEdit.phone}
                      onChange={(e) =>
                        setMemberToEdit({
                          ...memberToEdit,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-email" className="mb-2">
                      Email *
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      placeholder="Enter email address"
                      value={memberToEdit.email}
                      onChange={(e) =>
                        setMemberToEdit({
                          ...memberToEdit,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-join-date" className="mb-2">
                      Joining Date *
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !memberToEdit?.join_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {memberToEdit?.join_date ? (
                            format(toLondonTime(memberToEdit.join_date), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            memberToEdit?.join_date
                              ? toLondonTime(memberToEdit.join_date)
                              : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              setMemberToEdit({
                                ...memberToEdit,
                                join_date: toUTC(date)
                                  .toISOString()
                                  .split("T")[0],
                              });
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="edit-status" className="mb-2">
                      Status
                    </Label>
                    <Select
                      value={memberToEdit.status}
                      onValueChange={(
                        value: "Active" | "Inactive" | "Suspended"
                      ) => setMemberToEdit({ ...memberToEdit, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="Suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleUpdateMember}
                disabled={
                  isSubmitting ||
                  !memberToEdit?.name ||
                  !memberToEdit?.phone ||
                  !memberToEdit?.email ||
                  !memberToEdit?.join_date
                }
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Updating Member...
                  </>
                ) : (
                  "Update Member"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!memberToDelete}
          onOpenChange={() => setMemberToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                member
                {memberToDelete && ` "${memberToDelete.name}"`} and remove their
                data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
