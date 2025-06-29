import { use } from "react";
import LoginForm from "@/components/login-form";

export default function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = use(params);
  const locale = resolvedParams.locale as "en" | "ps";

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm locale={locale} />
      </div>
    </div>
  );
}
