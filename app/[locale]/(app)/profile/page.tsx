
"use client";

import type React from "react";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft } from "lucide-react";
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
  Info,
  DollarSign,
  CheckCircle,
  Download,
  MoreVertical,
  MessageCircle,
} from "lucide-react";
import useSWR, { mutate } from "swr";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { fetchPayments } from "@/lib/server/payments";
import { fetchEvents } from "@/lib/server/events";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  fetchUserProfile,
  updateUserProfile,
  uploadProfileAvatar,
  deleteProfileAvatar,
  addFamilyMember,
  updateFamilyMember,
  deleteFamilyMember,
  validateUpdateProfileForm,
  validateFamilyMember,
  getChangedFields,
  sanitizeProfileData,
  type ProfileFormData,
  type UpdateProfileFormData,
  type FamilyMemberData
} from "@/lib/server/profile";
import { Messaging } from "@/components/social/Messaging";

// Types
interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  phone?: string;
  age?: number;
}

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  event_date: string;
  location?: string;
  status: 'upcoming' | 'attended' | 'cancelled' | 'pending';
  created_at?: string;
  updated_at?: string;
}

interface Payment {
  id: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
  paid_on?: string;
  active_until?: string;
  member_id: string;
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
    fetchUserProfile(userEmail!)
  );

  // Fetch payments
  const { data: paymentsData, isLoading: paymentsLoading } = useSWR(
    member?.id ? ["payments", member.id] : null,
    (key) => {
      const [, memberId] = key as [string, string];
      return fetchPayments({ memberId, page: 1, pageSize: 100 });
    }
  );
  const paymentHistory: Payment[] = paymentsData?.data || [];

  // Fetch all events
  const { data: eventsData, isLoading: eventsLoading } = useSWR(
    "all-events",
    () => fetchEvents({ page: 1, pageSize: 1000 })
  );
  const events: Event[] = eventsData?.data || [];

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

  // Validation state
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [familyValidationErrors, setFamilyValidationErrors] = useState<{
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

  const handleSave = async () => {
    if (!formData || !formData.id) return;
    
    // Validate the entire form using the update schema (excludes email)
    const validation = validateUpdateProfileForm(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      toast.error("Please fix the validation errors before saving.");
      return;
    }
    setValidationErrors({});
    
    // Build updates object with only changed fields
    const processedFormData = {
      ...formData,
      avatar: avatarPreview || formData.avatar,
      family_members: familyMembers,
    };
    
    const updates = getChangedFields(member, processedFormData);
    // Only update if there are changes
    if (Object.keys(updates).length === 0) {
      setIsEditing(false);
      return;
    }
    try {
      await updateUserProfile(formData.id, updates);
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
    setValidationErrors({});
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



  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };



  const getPaymentStatus = (payment: Payment): {
    status: 'expired' | 'about-to-expire' | 'valid' | 'completed' | 'pending';
    label: string;
    color: string;
  } => {
    const now = new Date();
    const activeUntil = payment.active_until ? new Date(payment.active_until) : null;
    
    // If payment has a paid date, it's completed
    if (payment.paid_on) {
      return {
        status: 'completed',
        label: 'Completed',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      };
    }
    
    if (!activeUntil) {
      return {
        status: 'pending',
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      };
    }
    
    const daysUntilExpiry = Math.ceil((activeUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return {
        status: 'expired',
        label: 'Expired',
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      };
    } else if (daysUntilExpiry <= 7) {
      return {
        status: 'about-to-expire',
        label: 'Expires Soon',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      };
    } else {
      return {
        status: 'valid',
        label: 'Active',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      };
    }
  };

  const getEventStatus = (event: Event): {
    status: 'upcoming' | 'ongoing' | 'past' | 'today';
    label: string;
    color: string;
  } => {
    const now = new Date();
    const eventDate = new Date(event.date || event.event_date);
    const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if it's today
    const isToday = eventDate.toDateString() === now.toDateString();
    
    if (isToday) {
      return {
        status: 'today',
        label: 'Today',
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      };
    } else if (daysUntilEvent < 0) {
      return {
        status: 'past',
        label: 'Past',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      };
    } else if (daysUntilEvent <= 7) {
      return {
        status: 'upcoming',
        label: 'Upcoming',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      };
    } else {
      return {
        status: 'upcoming',
        label: 'Upcoming',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      };
    }
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
      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
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
                  <Label htmlFor="name" className="flex items-center gap-2">
                    Full Name
                    <span className="text-red-500">*</span>
                  </Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="name"
                        value={formData.name || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Enter your full name (e.g., John Smith)"
                        className={validationErrors.name ? "border-red-500" : ""}
                      />
                      <div className="flex items-start gap-1 text-xs text-muted-foreground">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>Only letters, spaces, hyphens, and apostrophes allowed</span>
                      </div>
                      {validationErrors.name && (
                        <div className="text-xs text-red-500 mt-1">
                          {validationErrors.name}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <User className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{formData.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{formData.email}</span>
                  </div>
                  {isEditing && (
                    <div className="flex items-start gap-1 text-xs text-muted-foreground">
                      <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>Email cannot be changed for security reasons</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="phone"
                        value={formData.phone || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="+44 20 7946 0958 or 07123 456789"
                        type="tel"
                        className={validationErrors.phone ? "border-red-500" : ""}
                      />
                      <div className="flex items-start gap-1 text-xs text-muted-foreground">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>UK phone numbers only (mobile: 07xxx xxx xxx, landline: 020 xxxx xxxx)</span>
                      </div>
                      {validationErrors.phone && (
                        <div className="text-xs text-red-500 mt-1">
                          {validationErrors.phone}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{formData.phone || "Not provided"}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency-contact">Emergency Contact Number</Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="emergency-contact"
                        value={formData.emergency_contact_number || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emergency_contact_number: e.target.value,
                          })
                        }
                        placeholder="+44 7911 123456"
                        type="tel"
                        className={validationErrors.emergency_contact_number ? "border-red-500" : ""}
                      />
                      <div className="flex items-start gap-1 text-xs text-muted-foreground">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>UK phone number for emergency contact</span>
                      </div>
                      {validationErrors.emergency_contact_number && (
                        <div className="text-xs text-red-500 mt-1">
                          {validationErrors.emergency_contact_number}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {formData.emergency_contact_number || "Not provided"}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.date_of_birth || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            date_of_birth: e.target.value,
                          })
                        }
                        className={validationErrors.date_of_birth ? "border-red-500" : ""}
                        max={new Date().toISOString().split('T')[0]}
                      />
                      <div className="flex items-start gap-1 text-xs text-muted-foreground">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>Must be a valid date in the past</span>
                      </div>
                      {validationErrors.date_of_birth && (
                        <div className="text-xs text-red-500 mt-1">
                          {validationErrors.date_of_birth}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>{formData.date_of_birth ? formatDate(formData.date_of_birth) : "Not provided"}</span>
                    </div>
                  )}
                </div>
              </div>

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
                          value={formData.current_address || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              current_address: e.target.value,
                            })
                          }
                          placeholder="Enter your current address"
                          className={validationErrors.current_address ? "border-red-500" : ""}
                          rows={3}
                        />
                        <div className="flex items-start gap-1 text-xs text-muted-foreground">
                          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>Must be at least 10 characters if provided</span>
                        </div>
                        {validationErrors.current_address && (
                          <div className="text-xs text-red-500 mt-1">
                            {validationErrors.current_address}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-start gap-2 p-2 bg-muted rounded min-h-[60px]">
                        <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">
                          {formData.current_address || "Not provided"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="back-home-address">Back Home Address</Label>
                    {isEditing ? (
                      <Textarea
                        id="back-home-address"
                        value={formData.back_home_address || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            back_home_address: e.target.value,
                          })
                        }
                        placeholder="Enter your back home address"
                        rows={3}
                      />
                    ) : (
                      <div className="flex items-start gap-2 p-2 bg-muted rounded min-h-[60px]">
                        <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">
                          {formData.back_home_address || "Not provided"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Family Members Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-lg font-semibold">Family Members</h3>
                  {isEditing && (
                    <Dialog open={isAddingFamily} onOpenChange={setIsAddingFamily}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Family Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Add Family Member</DialogTitle>
                          <DialogDescription>
                            Add a new family member to your profile.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="family-name">Name</Label>
                            <Input
                              id="family-name"
                              value={newFamilyMember.name}
                              onChange={(e) =>
                                setNewFamilyMember({
                                  ...newFamilyMember,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Enter family member's name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="family-relationship">Relationship</Label>
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
                                {relationshipOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="family-phone">Phone (Optional)</Label>
                            <Input
                              id="family-phone"
                              value={newFamilyMember.phone}
                              onChange={(e) =>
                                setNewFamilyMember({
                                  ...newFamilyMember,
                                  phone: e.target.value,
                                })
                              }
                              placeholder="+44 7911 123456"
                              type="tel"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="family-age">Age (Optional)</Label>
                            <Input
                              id="family-age"
                              value={newFamilyMember.age || ""}
                              onChange={(e) =>
                                setNewFamilyMember({
                                  ...newFamilyMember,
                                  age: e.target.value ? parseInt(e.target.value) : undefined,
                                })
                              }
                              placeholder="Enter age"
                              type="number"
                              min="0"
                              max="120"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={resetFamilyForm}>
                            Cancel
                          </Button>
                          <Button onClick={handleAddFamilyMember}>
                            Add Member
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {familyMembers.length > 0 ? (
                  <div className="grid gap-3">
                    {familyMembers.map((familyMember) => (
                      <Card key={familyMember.id} className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4 flex-shrink-0" />
                            <div>
                              <p className="font-medium">{familyMember.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {familyMember.relationship}
                                {familyMember.age && ` • ${familyMember.age} years old`}
                              </p>
                              {familyMember.phone && (
                                <p className="text-xs text-muted-foreground">
                                  {familyMember.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          {isEditing && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditFamilyMember(familyMember)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Family Member</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove {familyMember.name} from your family members?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteFamilyMember(familyMember.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No family members added yet</p>
                    {isEditing && (
                      <p className="text-sm">Click "Add Family Member" to get started</p>
                    )}
                  </div>
                )}

                {/* Edit Family Member Dialog */}
                <Dialog open={!!editingFamily} onOpenChange={(open) => !open && setEditingFamily(null)}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Edit Family Member</DialogTitle>
                      <DialogDescription>
                        Update family member information.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-family-name">Name</Label>
                        <Input
                          id="edit-family-name"
                          value={newFamilyMember.name}
                          onChange={(e) =>
                            setNewFamilyMember({
                              ...newFamilyMember,
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter family member's name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-family-relationship">Relationship</Label>
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
                            {relationshipOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-family-phone">Phone (Optional)</Label>
                        <Input
                          id="edit-family-phone"
                          value={newFamilyMember.phone}
                          onChange={(e) =>
                            setNewFamilyMember({
                              ...newFamilyMember,
                              phone: e.target.value,
                            })
                          }
                          placeholder="+44 7911 123456"
                          type="tel"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-family-age">Age (Optional)</Label>
                        <Input
                          id="edit-family-age"
                          value={newFamilyMember.age || ""}
                          onChange={(e) =>
                            setNewFamilyMember({
                              ...newFamilyMember,
                              age: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          placeholder="Enter age"
                          type="number"
                          min="0"
                          max="120"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditingFamily(null)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateFamilyMember}>
                        Update Member
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
            </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <div className="space-y-6">
            {/* Payment Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Spent</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(paymentHistory.reduce((sum: number, p: any) => sum + p.amount, 0))}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">Expired</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {paymentHistory.filter((p: Payment) => getPaymentStatus(p).status === "expired").length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">Due Soon</CardTitle>
                  <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {paymentHistory.filter((p: Payment) => getPaymentStatus(p).status === "about-to-expire").length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Completed</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {paymentHistory.filter((p: Payment) => getPaymentStatus(p).status === "completed").length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Total Payments</CardTitle>
                  <CreditCard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {paymentHistory.length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Payment History */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Payment History</CardTitle>
                    <CardDescription className="text-sm">
                      Track your payment transactions and history
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {paymentsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : paymentHistory.length > 0 ? (
                  <div className="divide-y">
                    {paymentHistory.map((payment: Payment) => (
                      <div key={payment.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-full bg-primary/10">
                              <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{payment.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(payment.created_at)}
                              </p>
                              {payment.active_until && (
                                <p className="text-xs text-muted-foreground">
                                  Active until: {formatDate(payment.active_until)}
                                </p>
                              )}
                              {payment.paid_on && (
                                <p className="text-xs text-muted-foreground">
                                  Paid: {formatDateTime(payment.paid_on)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold text-sm">{formatCurrency(payment.amount)}</p>
                              <Badge
                                className={`text-xs ${getPaymentStatus(payment).color}`}>
                                {getPaymentStatus(payment).label}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                      <CreditCard className="h-12 w-12 opacity-50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No payments found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You haven't made any payments yet.
                    </p>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Make First Payment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events">
          <div className="space-y-6">
            {/* Events Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">Today</CardTitle>
                  <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {events.filter((e: Event) => getEventStatus(e).status === "today").length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">This Week</CardTitle>
                  <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                    {events.filter((e: Event) => getEventStatus(e).status === "upcoming" && getEventStatus(e).label === "Upcoming").length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 border-gray-200 dark:border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Past</CardTitle>
                  <CheckCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {events.filter((e: Event) => getEventStatus(e).status === "past").length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">Total</CardTitle>
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {events.length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Events List */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Events & Activities</CardTitle>
                    <CardDescription className="text-sm">
                      Discover and track your community events
                    </CardDescription>
                  </div>
                  <TabsTrigger value="events" className="flex-1 sm:flex-none">
                    <Calendar className="h-4 w-4 mr-2" />
                    Events
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="flex-1 sm:flex-none">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Messages
                  </TabsTrigger>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {eventsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : events.length > 0 ? (
                  <div className="divide-y">
                    {events.map((event: Event) => {
                      const eventStatus = getEventStatus(event);
                      
                      return (
                        <div key={event.id} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className={`p-2 rounded-full ${eventStatus.status === 'today' ? 'bg-purple-100 dark:bg-purple-900' : 
                                eventStatus.status === 'upcoming' ? 'bg-blue-100 dark:bg-blue-900' : 
                                'bg-gray-100 dark:bg-gray-800'}`}>
                                <Calendar className={`h-5 w-5 ${eventStatus.status === 'today' ? 'text-purple-600 dark:text-purple-400' : 
                                  eventStatus.status === 'upcoming' ? 'text-blue-600 dark:text-blue-400' : 
                                  'text-gray-600 dark:text-gray-400'}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-sm">{event.title}</p>
                                  <Badge className={`text-xs ${eventStatus.color}`}>
                                    {eventStatus.label}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  {formatDateTime(event.date || event.event_date)}
                                </p>
                                {event.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {event.description}
                                  </p>
                                )}
                                {event.location && (
                                  <p className="text-xs text-muted-foreground">
                                    <MapPin className="inline h-3 w-3 mr-1" />
                                    {event.location}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="h-8 px-3 text-xs">
                                Details
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
                      <Calendar className="h-12 w-12 opacity-50" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No events found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You haven't joined any events yet.
                    </p>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Browse Events
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                Connect with other members of the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {member && (
                <Messaging currentUser={{ id: member.id, name: member.name, avatar: member.avatar }} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}