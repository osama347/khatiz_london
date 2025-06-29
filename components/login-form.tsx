"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

import { cn } from "@/lib/utils";
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
import Link from "next/link";
import { toast } from "sonner";

const translations = {
  en: {
    login: "Login",
    enterEmailToLogin: "Enter your email below to login to your account",
    email: "Email",
    emailPlaceholder: "m@example.com",
    password: "Password",
    forgotPassword: "Forgot your password?",
    loggingIn: "Logging in...",
    loginButton: "Login",
    loggedInSuccessfully: "Logged in successfully!",
    anErrorOccurred: "An error occurred",
  },
  ps: {
    login: "ننوتل",
    enterEmailToLogin:
      "د خپل حساب ته د ننوتلو لپاره خپل بریښنالیک لاندې داخل کړئ",
    email: "بریښنالیک",
    emailPlaceholder: "m@example.com",
    password: "پټنوم",
    forgotPassword: "خپل پټنوم هیر شوی؟",
    loggingIn: "ننوتل کېږي...",
    loginButton: "ننوتل",
    loggedInSuccessfully: "په بریالیتوب سره ننوتل!",
    anErrorOccurred: "یو تیروتنه رامنځته شوه",
  },
};

type Locale = keyof typeof translations;

export default function LoginForm({
  className,
  locale = "en",
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { locale?: Locale }) {
  const t = translations[locale];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.session) {
        toast.success(t.loggedInSuccessfully);
        router.refresh();
        router.push("/");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : t.anErrorOccurred;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t.login}</CardTitle>
          <CardDescription>{t.enterEmailToLogin}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t.password}</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    {t.forgotPassword}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t.loggingIn : t.loginButton}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
