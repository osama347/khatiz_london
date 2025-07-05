"use client";

import { useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toCamelCase } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale as "en" | "ps";

  const translations = {
    en: {
      createAccount: "Create Account",
      signUpToGetStarted: "Sign up to get started with your account",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter your full name",
      email: "Email",
      emailPlaceholder: "Enter your email",
      password: "Password",
      passwordPlaceholder: "Create a password",
      creatingAccount: "Creating account...",
      createAccountButton: "Create Account",
      alreadyHaveAccount: "Already have an account?",
      signIn: "Sign in",
    },
    ps: {
      createAccount: "حساب جوړ کړئ",
      signUpToGetStarted: "د خپل حساب سره د پیل کولو لپاره نوم لیکنه وکړئ",
      fullName: "بشپړ نوم",
      fullNamePlaceholder: "خپل بشپړ نوم داخل کړئ",
      email: "بریښنالیک",
      emailPlaceholder: "خپل بریښنالیک داخل کړئ",
      password: "پټنوم",
      passwordPlaceholder: "یو پټنوم جوړ کړئ",
      creatingAccount: "حساب جوړ کېږي...",
      createAccountButton: "حساب جوړ کړئ",
      alreadyHaveAccount: "دمخه حساب لرئ؟",
      signIn: "ننوتل",
    },
  };

  const t = translations[locale];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // First, check if email already exists in members table
      const { data: existingMember, error: checkError } = await supabase
        .from("members")
        .select("id")
        .eq("email", email)
        .single();

      if (existingMember) {
        setError(
          "A member with this email already exists. Please sign in or use a different email."
        );
        setIsLoading(false);
        return;
      }

      // If email doesn't exist, proceed with signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: toCamelCase(fullName),
          },
        },
      });

      console.log("SignUp Response:", { data, error });

      if (error) {
        console.log("Supabase Auth Error:", error);
        console.log("Error message:", error.message);
        console.log("Error code:", error.status);

        const msg = error.message.toLowerCase();
        if (
          msg.includes("already registered") ||
          msg.includes("already exists") ||
          msg.includes("user with this email") ||
          msg.includes("duplicate key value") ||
          msg.includes("23505")
        ) {
          setError(
            "A member with this email already exists. Please sign in or use a different email."
          );
        } else {
          setError(error.message || "Registration failed");
        }
        return;
      }

      // Check if user was actually created
      if (data?.user) {
        console.log("User created successfully:", data.user);
        router.push(`/confirm?email=${encodeURIComponent(email)}`);
      } else {
        setError("Registration failed - no user created");
      }
    } catch (error: any) {
      console.log("Catch block error:", error);
      setError(error?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {t.createAccount}
          </CardTitle>
          <CardDescription className="text-center">
            {t.signUpToGetStarted}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="fullName">{t.fullName}</Label>
              <Input
                id="fullName"
                type="text"
                placeholder={t.fullNamePlaceholder}
                value={fullName}
                onChange={(e) => setFullName(toCamelCase(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t.creatingAccount}
                </>
              ) : (
                t.createAccountButton
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <span className="text-gray-600">{t.alreadyHaveAccount} </span>
            <Link href="/login" className="text-primary hover:underline">
              {t.signIn}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
