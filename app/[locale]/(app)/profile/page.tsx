"use client";

import type React from "react";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Users,
  AlertTriangle,
  CreditCard,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import useSWR, { mutate } from "swr";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { fetchFullMemberByEmail, updateMemberById } from "@/lib/server/members";
import { fetchPayments } from "@/lib/server/payments";
import { fetchEvents } from "@/lib/server/events";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Types
interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  age?: number;
}

export default function UserProfile() {
  const supabase = createClient();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function getUserEmail() {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) setUserEmail(data.user.email);
    }
    getUserEmail();
  }, [supabase]);

  // Fetch full member profile
  const {
    data: member,
    isLoading: memberLoading,
    error: memberError,
  } = useSWR(userEmail ? ["member-full", userEmail] : null, () =>
    fetchFullMemberByEmail(userEmail!)
  );

  // Fetch payments
  const { data: paymentsData, isLoading: paymentsLoading } = useSWR(
    member?.id ? ["payments", member.id] : null,
    (key) => {
      const [, memberId] = key as [string, string];
      return fetchPayments({ memberId, page: 1, pageSize: 100 });
    }
  );
  const paymentHistory = paymentsData?.data || [];

  // Fetch events (optionally filter by member, if needed)
  const { data: eventsData, isLoading: eventsLoading } = useSWR(
    userEmail ? ["events", userEmail] : null,
    () =>
      fetchEvents({ searchTerm: member?.name || "", page: 1, pageSize: 100 })
  );
  const events = eventsData?.data || [];

  // State for editing, family, etc. (initialize from member when loaded)
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isAddingFamily, setIsAddingFamily] = useState(false);
  const [editingFamily, setEditingFamily] = useState<FamilyMember | null>(null);
  const [newFamilyMember, setNewFamilyMember] = useState<
    Omit<FamilyMember, "id">
  >({
    name: "",
    relationship: "",
    phone: "",
    age: undefined,
  });

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Validation helpers
  function isValidUKPhone(phone: string | undefined | null) {
    if (!phone) return true; // treat empty/undefined as valid (or adjust as needed)
    return /^((\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}|(\+44\s?20|020)\s?\d{4}\s?\d{4})$/.test(
      phone.trim()
    );
  }
  function isValidUKPostcode(postcode: string | undefined | null) {
    if (!postcode) return true; // treat empty/undefined as valid (or adjust as needed)
    return /^([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2})$/i.test(postcode.trim());
  }
  // Error state
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});

  useEffect(() => {
    if (member) {
      setFormData(member);
      setFamilyMembers(
        Array.isArray(member.family_members) ? member.family_members : []
      );
    }
  }, [member]);

  // Loading and error states
  if (memberLoading || !userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }
  if (memberError || !member) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Member not found or error loading profile.
      </div>
    );
  }
  if (!formData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file.");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB.");
        return;
      }

      setIsUploadingAvatar(true);

      // Generate a unique filename (e.g., userId + timestamp)
      const fileExt = file.name.split(".").pop();
      const fileName = `avatar-${formData.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        toast.error("Failed to upload avatar.");
        setIsUploadingAvatar(false);
        return;
      }

      // Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData?.publicUrl;

      if (!publicUrl) {
        toast.error("Failed to get avatar URL.");
        setIsUploadingAvatar(false);
        return;
      }

      setFormData({ ...formData, avatar: publicUrl });
      setAvatarPreview(publicUrl);
      setIsUploadingAvatar(false);
      toast.success("Avatar uploaded! Don't forget to save your profile.");
    }
  };

  const removeAvatarPreview = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    setFormData({ ...formData, avatar: member?.avatar || "/placeholder.svg" });
  };

  // Helper to get changed fields
  function getChangedFields(original: any, updated: any) {
    const changed: any = {};
    Object.keys(updated).forEach((key) => {
      if (typeof updated[key] === "object" && updated[key] !== null) {
        if (JSON.stringify(updated[key]) !== JSON.stringify(original[key])) {
          changed[key] = updated[key];
        }
      } else if (updated[key] !== original[key]) {
        changed[key] = updated[key];
      }
    });
    return changed;
  }

  const handleSave = async () => {
    if (!formData || !formData.id) return;
    // Build updates object with only changed fields
    const updates = getChangedFields(member, {
      ...formData,
      avatar: avatarPreview || formData.avatar,
      family_members: familyMembers,
    });
    // Only validate changed fields
    const errors: { [key: string]: string } = {};
    if ("phone" in updates && !isValidUKPhone(updates.phone)) {
      errors.phone = "Please enter a valid UK phone number.";
    }
    if (
      "emergency_contact_number" in updates &&
      !isValidUKPhone(updates.emergency_contact_number)
    ) {
      errors.emergency_contact_number = "Please enter a valid UK phone number.";
    }
    if (
      "current_postcode" in updates &&
      !isValidUKPostcode(updates.current_postcode)
    ) {
      errors.current_postcode = "Please enter a valid UK postcode.";
    }
    // No UK validation for home_postcode
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});
    // Only update if there are changes
    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }
    try {
      await updateMemberById(formData.id, updates);
      mutate(["member-full", formData.email]);
      toast.success("Profile updated successfully!");
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
    }
  };

  const handleCancel = () => {
    setFormData(member);
    setFamilyMembers(member?.family_members || []);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    setIsEditing(false);
  };

  const handleAddFamilyMember = () => {
    if (newFamilyMember.name && newFamilyMember.relationship) {
      const newMember: FamilyMember = {
        ...newFamilyMember,
        id: `fam-${Date.now()}`,
        age: newFamilyMember.age || undefined,
      };
      setFamilyMembers([...familyMembers, newMember]);
      setNewFamilyMember({
        name: "",
        relationship: "",
        phone: "",
        age: undefined,
      });
      setIsAddingFamily(false);
    }
  };

  const handleEditFamilyMember = (member: FamilyMember) => {
    setEditingFamily(member);
    setNewFamilyMember({
      name: member.name,
      relationship: member.relationship,
      phone: member.phone || "",
      age: member.age,
    });
  };

  const handleUpdateFamilyMember = () => {
    if (editingFamily && newFamilyMember.name && newFamilyMember.relationship) {
      setFamilyMembers(
        familyMembers.map((member) =>
          member.id === editingFamily.id
            ? {
                ...member,
                name: newFamilyMember.name,
                relationship: newFamilyMember.relationship,
                phone: newFamilyMember.phone || undefined,
                age: newFamilyMember.age || undefined,
              }
            : member
        )
      );
      setEditingFamily(null);
      setNewFamilyMember({
        name: "",
        relationship: "",
        phone: "",
        age: undefined,
      });
    }
  };

  const handleDeleteFamilyMember = (id: string) => {
    setFamilyMembers(familyMembers.filter((member) => member.id !== id));
  };

  const resetFamilyForm = () => {
    setNewFamilyMember({
      name: "",
      relationship: "",
      phone: "",
      age: undefined,
    });
    setIsAddingFamily(false);
    setEditingFamily(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const relationshipOptions = [
    "Spouse",
    "Partner",
    "Child",
    "Son",
    "Daughter",
    "Parent",
    "Father",
    "Mother",
    "Sibling",
    "Brother",
    "Sister",
    "Grandparent",
    "Grandchild",
    "Other",
  ];

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success("Signed out successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="container mx-auto p-3 sm:p-4 max-w-6xl">
      {/* Logout Button */}
      <div className="flex justify-end mb-2">
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Log out
        </Button>
      </div>
      {/* Header Section */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                <AvatarImage
                  src={avatarPreview || formData.avatar || "/placeholder.svg"}
                  alt={formData.name}
                />
                <AvatarFallback className="text-lg">
                  {formData.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              {isEditing && (
                <div className="absolute -bottom-1 -right-1">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={isUploadingAvatar}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 rounded-full p-0"
                      disabled={isUploadingAvatar}
                    >
                      {isUploadingAvatar ? (
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <Edit className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-bold truncate">
                    {formData.name}
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base truncate">
                    {formData.email}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={
                      formData.status === "Active" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {formData.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {formData.role}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="personal" className="space-y-3 sm:space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-3 gap-1 h-auto p-1 min-w-[280px]">
            <TabsTrigger
              value="personal"
              className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap"
            >
              Personal
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap"
            >
              Payments
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="text-xs sm:text-sm px-2 py-2 whitespace-nowrap"
            >
              Events
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Personal Information Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg sm:text-xl">
                    Personal Information
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Manage your personal details and contact information
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        onClick={handleSave}
                        size="sm"
                        className="flex-1 sm:flex-none"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        size="sm"
                        className="flex-1 sm:flex-none bg-transparent"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{formData.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{formData.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="+44 20 7946 0958"
                        type="tel"
                      />
                      {validationErrors.phone && (
                        <div className="text-xs text-destructive mt-1">
                          {validationErrors.phone}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{formData.phone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      id="dob"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          date_of_birth: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{formatDate(formData.date_of_birth)}</span>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Profile Picture</h3>
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage
                          src={
                            avatarPreview ||
                            formData.avatar ||
                            "/placeholder.svg"
                          }
                          alt={formData.name}
                        />
                        <AvatarFallback className="text-xl">
                          {formData.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="absolute -bottom-1 -right-1">
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isUploadingAvatar}
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 rounded-full p-0"
                            disabled={isUploadingAvatar}
                          >
                            {isUploadingAvatar ? (
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Edit className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2">
                      <div>
                        <h4 className="font-medium">Upload Profile Picture</h4>
                        <p className="text-sm text-muted-foreground">
                          Choose a photo that represents you. Recommended size:
                          400x400px
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isUploadingAvatar}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isUploadingAvatar}
                            className="w-full sm:w-auto bg-transparent"
                          >
                            {isUploadingAvatar ? (
                              <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <User className="h-4 w-4 mr-2" />
                                Choose Photo
                              </>
                            )}
                          </Button>
                        </div>

                        {avatarPreview && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={removeAvatarPreview}
                            className="w-full sm:w-auto bg-transparent"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        Supported formats: JPG, PNG, GIF. Max size: 5MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-address">Current Address</Label>
                    {isEditing ? (
                      <>
                        <Textarea
                          id="current-address"
                          value={formData.current_address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              current_address: e.target.value,
                            })
                          }
                          className="min-h-[80px]"
                          placeholder="221B Baker St, London NW1 6XE"
                        />
                        <Input
                          id="current-postcode"
                          value={formData.current_postcode || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              current_postcode: e.target.value,
                            })
                          }
                          placeholder="NW1 6XE"
                          className="mt-2"
                        />
                        {validationErrors.current_postcode && (
                          <div className="text-xs text-destructive mt-1">
                            {validationErrors.current_postcode}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-start gap-2 p-2 bg-muted rounded min-h-[80px]">
                        <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                        <span className="text-sm">
                          {formData.current_address}
                          {formData.current_postcode
                            ? `, ${formData.current_postcode}`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="home-address">Home Address</Label>
                    {isEditing ? (
                      <>
                        <Textarea
                          id="home-address"
                          value={formData.back_home_address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              back_home_address: e.target.value,
                            })
                          }
                          className="min-h-[80px]"
                          placeholder="10 Downing St, London SW1A 2AA"
                        />
                        <Input
                          id="home-postcode"
                          value={formData.home_postcode || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              home_postcode: e.target.value,
                            })
                          }
                          placeholder="11000"
                          className="mt-2"
                        />
                        {/* No validation error for home_postcode */}
                      </>
                    ) : (
                      <div className="flex items-start gap-2 p-2 bg-muted rounded min-h-[80px]">
                        <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                        <span className="text-sm">
                          {formData.back_home_address}
                          {formData.home_postcode
                            ? `, ${formData.home_postcode}`
                            : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-lg font-semibold">Emergency & Family</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency-contact">Emergency Contact</Label>
                    {isEditing ? (
                      <>
                        <Input
                          id="emergency-contact"
                          value={formData.emergency_contact_number}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              emergency_contact_number: e.target.value,
                            })
                          }
                          placeholder="+44 7911 123456"
                          type="tel"
                        />
                        {validationErrors.emergency_contact_number && (
                          <div className="text-xs text-destructive mt-1">
                            {validationErrors.emergency_contact_number}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {formData.emergency_contact_number}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Family Members</Label>
                      {isEditing && (
                        <Dialog
                          open={isAddingFamily}
                          onOpenChange={setIsAddingFamily}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Add Family Member</DialogTitle>
                              <DialogDescription>
                                Add a new family member to your profile.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="family-name">Name *</Label>
                                <Input
                                  id="family-name"
                                  value={newFamilyMember.name}
                                  onChange={(e) =>
                                    setNewFamilyMember({
                                      ...newFamilyMember,
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="Enter full name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="family-relationship">
                                  Relationship *
                                </Label>
                                <Select
                                  value={newFamilyMember.relationship}
                                  onValueChange={(value) =>
                                    setNewFamilyMember({
                                      ...newFamilyMember,
                                      relationship: value,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select relationship" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {relationshipOptions.map(
                                      (option: string) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="family-phone">
                                  Phone (Optional)
                                </Label>
                                <Input
                                  id="family-phone"
                                  value={newFamilyMember.phone}
                                  onChange={(e) =>
                                    setNewFamilyMember({
                                      ...newFamilyMember,
                                      phone: e.target.value,
                                    })
                                  }
                                  placeholder="Enter phone number"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="family-age">
                                  Age (Optional)
                                </Label>
                                <Input
                                  id="family-age"
                                  type="number"
                                  value={newFamilyMember.age || ""}
                                  onChange={(e) =>
                                    setNewFamilyMember({
                                      ...newFamilyMember,
                                      age: e.target.value
                                        ? Number.parseInt(e.target.value)
                                        : undefined,
                                    })
                                  }
                                  placeholder="Enter age"
                                />
                              </div>
                            </div>
                            <DialogFooter className="flex-col sm:flex-row gap-2">
                              <Button
                                variant="outline"
                                onClick={resetFamilyForm}
                                className="w-full sm:w-auto bg-transparent"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleAddFamilyMember}
                                disabled={
                                  !newFamilyMember.name ||
                                  !newFamilyMember.relationship
                                }
                                className="w-full sm:w-auto"
                              >
                                Add Member
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {familyMembers.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                          No family members added yet.
                        </div>
                      ) : (
                        familyMembers.map((member: FamilyMember) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between gap-2 p-2 bg-muted rounded"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Users className="h-4 w-4 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <span className="text-sm font-medium block truncate">
                                  {member.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {member.relationship}
                                  {member.phone && ` • ${member.phone}`}
                                  {member.age && ` • Age ${member.age}`}
                                </span>
                              </div>
                            </div>
                            {isEditing && (
                              <div className="flex gap-1 flex-shrink-0">
                                <Dialog
                                  open={editingFamily?.id === member.id}
                                  onOpenChange={(open) => {
                                    if (!open) {
                                      setEditingFamily(null);
                                      resetFamilyForm();
                                    }
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleEditFamilyMember(member)
                                      }
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>
                                        Edit Family Member
                                      </DialogTitle>
                                      <DialogDescription>
                                        Update the details of this family
                                        member.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-family-name">
                                          Name *
                                        </Label>
                                        <Input
                                          id="edit-family-name"
                                          value={newFamilyMember.name}
                                          onChange={(e) =>
                                            setNewFamilyMember({
                                              ...newFamilyMember,
                                              name: e.target.value,
                                            })
                                          }
                                          placeholder="Enter full name"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-family-relationship">
                                          Relationship *
                                        </Label>
                                        <Select
                                          value={newFamilyMember.relationship}
                                          onValueChange={(value) =>
                                            setNewFamilyMember({
                                              ...newFamilyMember,
                                              relationship: value,
                                            })
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select relationship" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {relationshipOptions.map(
                                              (option: string) => (
                                                <SelectItem
                                                  key={option}
                                                  value={option}
                                                >
                                                  {option}
                                                </SelectItem>
                                              )
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-family-phone">
                                          Phone (Optional)
                                        </Label>
                                        <Input
                                          id="edit-family-phone"
                                          value={newFamilyMember.phone}
                                          onChange={(e) =>
                                            setNewFamilyMember({
                                              ...newFamilyMember,
                                              phone: e.target.value,
                                            })
                                          }
                                          placeholder="Enter phone number"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-family-age">
                                          Age (Optional)
                                        </Label>
                                        <Input
                                          id="edit-family-age"
                                          type="number"
                                          value={newFamilyMember.age || ""}
                                          onChange={(e) =>
                                            setNewFamilyMember({
                                              ...newFamilyMember,
                                              age: e.target.value
                                                ? Number.parseInt(
                                                    e.target.value
                                                  )
                                                : undefined,
                                            })
                                          }
                                          placeholder="Enter age"
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter className="flex-col sm:flex-row gap-2">
                                      <Button
                                        variant="outline"
                                        onClick={() => {
                                          setEditingFamily(null);
                                          resetFamilyForm();
                                        }}
                                        className="w-full sm:w-auto"
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        onClick={handleUpdateFamilyMember}
                                        disabled={
                                          !newFamilyMember.name ||
                                          !newFamilyMember.relationship
                                        }
                                        className="w-full sm:w-auto"
                                      >
                                        Update Member
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Family Member
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to remove{" "}
                                        {member.name} from your family members?
                                        This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDeleteFamilyMember(member.id)
                                        }
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <strong>Member Since:</strong>{" "}
                  {formatDate(formData.join_date)}
                </div>
                <div>
                  <strong>Account Created:</strong>{" "}
                  {formatDateTime(formData.created_at)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">
                Payment History
              </CardTitle>
              <CardDescription className="text-sm">
                View your subscription and payment records
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {paymentsLoading ? (
                  <div className="text-center py-8">
                    Loading payment history...
                  </div>
                ) : paymentHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No payment history found.
                  </div>
                ) : (
                  paymentHistory.map((payment: any) => (
                    <div
                      key={payment.id}
                      className="flex flex-col gap-3 p-3 sm:p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                          <CreditCard className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            Paid on {formatDateTime(payment.paid_on)}
                          </p>
                        </div>
                        {/* Expired badge */}
                        {payment.active_until &&
                          new Date(payment.active_until) < new Date() && (
                            <Badge
                              variant="destructive"
                              className="text-xs ml-2"
                            >
                              Expired
                            </Badge>
                          )}
                      </div>
                      <div className="flex justify-end">
                        <Badge variant="outline" className="text-xs">
                          Active until {formatDate(payment.active_until)}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Events</CardTitle>
              <CardDescription className="text-sm">
                Events you're registered for or interested in
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {eventsLoading ? (
                  <div className="text-center py-8">Loading events...</div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No events found.
                  </div>
                ) : (
                  events.map((event: any) => (
                    <div
                      key={event.id}
                      className="p-3 sm:p-4 border rounded-lg"
                    >
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-base sm:text-lg">
                            {event.title}
                          </h3>
                          <p className="text-muted-foreground mt-1 text-sm">
                            {event.description}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>{formatDate(event.event_date)}</span>
                            {/* Past Event badge */}
                            {event.event_date &&
                              new Date(event.event_date) < new Date() && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs ml-2"
                                >
                                  Past Event
                                </Badge>
                              )}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto bg-transparent"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
