"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const languages = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "ps", label: "پښتو", flag: "🇦🇫" },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    // Replace the first segment of the path with the new locale
    const segments = pathname.split("/");
    if (languages.some((l) => l.code === segments[1])) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join("/");
    router.push(newPath);
  };

  // Detect current locale from the path
  const currentLocale = (() => {
    const segments = pathname.split("/");
    return languages.some((l) => l.code === segments[1]) ? segments[1] : "en";
  })();

  const currentLanguage = languages.find((lang) => lang.code === currentLocale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-muted/50"
        >
          <Globe className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              currentLocale === language.code && "bg-muted"
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">{language.flag}</span>
              <span className="text-sm font-medium">{language.label}</span>
            </div>
            {currentLocale === language.code && (
              <Check className="h-3 w-3 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
