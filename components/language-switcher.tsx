"use client";

import { usePathname, useRouter } from "next/navigation";

const languages = [
  { code: "en", label: "English" },
  { code: "ps", label: "پښتو" },
];

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
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

  return (
    <select
      value={currentLocale}
      onChange={handleChange}
      className="border rounded px-2 py-1"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
}
