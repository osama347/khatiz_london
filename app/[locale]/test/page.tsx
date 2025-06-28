import { use } from "react";

export default function TestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = use(params);
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Test Page</h1>
      <p>Current locale: {resolvedParams.locale}</p>
      <p>This page should work for both /en/test and /de/test</p>
    </div>
  );
}
