"use client";

import { useEffect, useState } from "react";

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Measure page load time
      const loadTime = performance.now();

      // Measure First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(
          (entry) => entry.name === "first-contentful-paint"
        );
        if (fcpEntry) {
          setMetrics((prev) => ({
            ...prev,
            firstContentfulPaint: fcpEntry.startTime,
          }));
        }
      });

      // Measure Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lcpEntry = entries[entries.length - 1];
        if (lcpEntry) {
          setMetrics((prev) => ({
            ...prev,
            largestContentfulPaint: lcpEntry.startTime,
          }));
        }
      });

      // Measure Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        setMetrics((prev) => ({
          ...prev,
          cumulativeLayoutShift: clsValue,
        }));
      });

      try {
        fcpObserver.observe({ entryTypes: ["paint"] });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
        clsObserver.observe({ entryTypes: ["layout-shift"] });
      } catch (error) {
        console.warn("Performance monitoring not supported:", error);
      }

      // Set load time
      setMetrics((prev) => ({
        ...prev,
        loadTime,
      }));

      // Cleanup observers
      return () => {
        fcpObserver.disconnect();
        lcpObserver.disconnect();
        clsObserver.disconnect();
      };
    }
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== "development" || !metrics) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono z-50">
      <div>Load: {metrics.loadTime.toFixed(0)}ms</div>
      {metrics.firstContentfulPaint && (
        <div>FCP: {metrics.firstContentfulPaint.toFixed(0)}ms</div>
      )}
      {metrics.largestContentfulPaint && (
        <div>LCP: {metrics.largestContentfulPaint.toFixed(0)}ms</div>
      )}
      {metrics.cumulativeLayoutShift && (
        <div>CLS: {metrics.cumulativeLayoutShift.toFixed(3)}</div>
      )}
    </div>
  );
}
