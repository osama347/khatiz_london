import { use } from "react";

const translations = {
  en: {
    testPage: "Test Page",
    currentLocale: "Current locale",
    shouldWorkForBoth: "This page should work for both /en/test and /ps/test",
  },
  ps: {
    testPage: "د ازموینې پاڼه",
    currentLocale: "اوسنی ژبه",
    shouldWorkForBoth: "دا پاڼه باید د /en/test او /ps/test لپاره کار وکړي",
  },
};

type Locale = keyof typeof translations;

export default function TestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = use(params);
  const locale: Locale = (
    resolvedParams.locale in translations ? resolvedParams.locale : "en"
  ) as Locale;
  const t = translations[locale];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{t.testPage}</h1>
      <p>
        {t.currentLocale}: {resolvedParams.locale}
      </p>
      <p>{t.shouldWorkForBoth}</p>
    </div>
  );
}
