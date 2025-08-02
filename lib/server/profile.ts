
import { createClient } from "@/utils/supabase/client";
import { z } from "zod";

// Zod Validation Schemas
const ukPhoneRegex = /^(\+44\s?7\d{3}|\(?07\d{3}\)?\s?\d{3}\s?\d{3}|\+44\s?20\s?\d{4}\s?\d{4}|020\s?\d{4}\s?\d{4}|\+44\s?1\d{3}\s?\d{6}|01\d{3}\s?\d{6})$/;
const ukPostcodeRegex = /^([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i;

const ProfileFormSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  
  email: z.string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  
  phone: z.string()
    .optional()
    .refine((val) => !val || ukPhoneRegex.test(val.replace(/\s/g, '')), {
      message: "Please enter a valid UK phone number (e.g., +44 20 7946 0958 or 07123 456789)"
    }),
  
  date_of_birth: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      return date <= now && age <= 120;
    }, {
      message: "Please enter a valid date of birth (must be in the past and realistic)"
    }),
  
  current_address: z.string()
    .optional()
    .refine((val) => !val || val.length >= 10, {
      message: "Address must be at least 10 characters if provided"
    }),
  
  back_home_address: z.string().optional(),
  
  emergency_contact_number: z.string()
    .optional()
    .refine((val) => !val || ukPhoneRegex.test(val.replace(/\s/g, '')), {
      message: "Please enter a valid UK phone number for emergency contact"
    }),

  // Additional fields from the member schema
  avatar: z.string().optional(),
  status: z.string().optional(),
  family_members: z.any().optional(), // JSONB field
  join_date: z.string().optional(),
  created_at: z.string().optional()
});

// Update schema that excludes email field
const UpdateProfileFormSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
    .optional(),
  
  phone: z.string()
    .optional()
    .refine((val) => !val || ukPhoneRegex.test(val.replace(/\s/g, '')), {
      message: "Please enter a valid UK phone number (e.g., +44 20 7946 0958 or 07123 456789)"
    }),
  
  date_of_birth: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      return date <= now && age <= 120;
    }, {
      message: "Please enter a valid date of birth (must be in the past and realistic)"
    }),
  
  current_address: z.string()
    .optional()
    .refine((val) => !val || val.length >= 10, {
      message: "Address must be at least 10 characters if provided"
    }),
  
  back_home_address: z.string().optional(),
  
  emergency_contact_number: z.string()
    .optional()
    .refine((val) => !val || ukPhoneRegex.test(val.replace(/\s/g, '')), {
      message: "Please enter a valid UK phone number for emergency contact"
    }),

  // Additional fields from the member schema
  avatar: z.string().optional(),
  status: z.string().optional(),
  family_members: z.any().optional(), // JSONB field
});

const FamilyMemberSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  
  relationship: z.string()
    .min(1, "Relationship is required")
    .max(30, "Relationship must be less than 30 characters"),
  
  phone: z.string()
    .optional()
    .refine((val) => !val || ukPhoneRegex.test(val.replace(/\s/g, '')), {
      message: "Please enter a valid UK phone number"
    }),
  
  age: z.number()
    .optional()
    .refine((val) => val === undefined || (val >= 0 && val <= 120), {
      message: "Age must be between 0 and 120"
    })
});

export type ProfileFormData = z.infer<typeof ProfileFormSchema>;
export type UpdateProfileFormData = z.infer<typeof UpdateProfileFormSchema>;
export type FamilyMemberData = z.infer<typeof FamilyMemberSchema>;

// Validation functions
export const validateProfileForm = (data: any): { isValid: boolean; errors: { [key: string]: string } } => {
  try {
    ProfileFormSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: { [key: string]: string } = {};
      error.issues.forEach((err: z.ZodIssue) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
};

export const validateUpdateProfileForm = (data: any): { isValid: boolean; errors: { [key: string]: string } } => {
  try {
    UpdateProfileFormSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: { [key: string]: string } = {};
      error.issues.forEach((err: z.ZodIssue) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
};

export const validateFamilyMember = (data: any): { isValid: boolean; errors: { [key: string]: string } } => {
  try {
    FamilyMemberSchema.parse(data);
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: { [key: string]: string } = {};
      error.issues.forEach((err: z.ZodIssue) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: { general: 'Validation failed' } };
  }
};

// Database operations
export async function fetchUserProfile(email: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("email", email)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateUserProfile(id: string, updates: Partial<UpdateProfileFormData>) {
  // Remove email field if it exists in updates (security measure)
  const { email, ...safeUpdates } = updates as any;
  
  // Validate the updates before saving using the update schema
  const validation = validateUpdateProfileForm(safeUpdates);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("members")
    .update(safeUpdates)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function uploadProfileAvatar(file: File, userId: string): Promise<string> {
  const supabase = createClient();
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Get public URL
  const { data } = supabase.storage
    .from('profile-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteProfileAvatar(avatarUrl: string): Promise<void> {
  const supabase = createClient();
  
  // Extract file path from URL
  const urlParts = avatarUrl.split('/');
  const fileName = urlParts[urlParts.length - 1];
  const filePath = `avatars/${fileName}`;

  const { error } = await supabase.storage
    .from('profile-images')
    .remove([filePath]);

  if (error) throw error;
}

// Family member operations
export async function addFamilyMember(memberId: string, familyMember: FamilyMemberData) {
  // Validate family member data
  const validation = validateFamilyMember(familyMember);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }

  const supabase = createClient();
  
  // First, get current family members
  const { data: currentMember, error: fetchError } = await supabase
    .from("members")
    .select("family_members")
    .eq("id", memberId)
    .single();

  if (fetchError) throw fetchError;

  const currentFamilyMembers = currentMember?.family_members || [];
  const newFamilyMember = {
    ...familyMember,
    id: `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };

  const updatedFamilyMembers = [...currentFamilyMembers, newFamilyMember];

  // Update the member with new family member
  const { data, error } = await supabase
    .from("members")
    .update({ family_members: updatedFamilyMembers })
    .eq("id", memberId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFamilyMember(memberId: string, familyMemberId: string, updates: Partial<FamilyMemberData>) {
  // Validate family member data
  const validation = validateFamilyMember(updates);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
  }

  const supabase = createClient();
  
  // Get current family members
  const { data: currentMember, error: fetchError } = await supabase
    .from("members")
    .select("family_members")
    .eq("id", memberId)
    .single();

  if (fetchError) throw fetchError;

  const currentFamilyMembers = currentMember?.family_members || [];
  const updatedFamilyMembers = currentFamilyMembers.map((member: any) =>
    member.id === familyMemberId ? { ...member, ...updates } : member
  );

  // Update the member with updated family member
  const { data, error } = await supabase
    .from("members")
    .update({ family_members: updatedFamilyMembers })
    .eq("id", memberId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFamilyMember(memberId: string, familyMemberId: string) {
  const supabase = createClient();
  
  // Get current family members
  const { data: currentMember, error: fetchError } = await supabase
    .from("members")
    .select("family_members")
    .eq("id", memberId)
    .single();

  if (fetchError) throw fetchError;

  const currentFamilyMembers = currentMember?.family_members || [];
  const updatedFamilyMembers = currentFamilyMembers.filter((member: any) => member.id !== familyMemberId);

  // Update the member with removed family member
  const { data, error } = await supabase
    .from("members")
    .update({ family_members: updatedFamilyMembers })
    .eq("id", memberId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Utility functions
export function getChangedFields(original: any, updated: any): any {
  const changed: any = {};
  Object.keys(updated).forEach((key) => {
    // Skip email field entirely
    if (key === 'email') return;
    
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

export function sanitizeProfileData(data: any): UpdateProfileFormData {
  // Remove any fields that aren't part of the update profile schema
  const allowedFields = [
    "name",
    // "email", // Explicitly excluded for updates
    "phone",
    "date_of_birth",
    "current_address",
    "back_home_address",
    "emergency_contact_number",
    "family_members",
    "avatar",
    "status",
  ];
  
  const sanitized: any = {};
  allowedFields.forEach(field => {
    if (data[field] !== undefined) {
      sanitized[field] = data[field];
    }
  });
  
  return sanitized;
}
