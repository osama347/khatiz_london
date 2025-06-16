"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const routeMap: { [key: string]: string } = {
  "": "Dashboard",
  members: "Members",
  payments: "Payments",
  reports: "Reports",
  events: "Events",
};

export function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Remove the (app) segment if it exists
  const filteredSegments = segments.filter((segment) => segment !== "(app)");

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
      <Link
        href="/"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {filteredSegments.map((segment, index) => {
        const href = `/${filteredSegments.slice(0, index + 1).join("/")}`;
        const isLast = index === filteredSegments.length - 1;
        const label = routeMap[segment] || segment;

        return (
          <div key={href} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            {isLast ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link
                href={href}
                className="hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
