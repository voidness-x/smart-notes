"use client";

import { HelpCircle } from "lucide-react";

export default function SupportPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl border-2 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
        <div className="relative text-red-500">
          {/* Spinning circle */}
          <div className="w-20 h-20 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          {/* HelpCircle icon in the center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-red-500 animate-pulse" />
          </div>
        </div>
        <p className="text-lg font-semibold text-red-500">
          Loading Support...
        </p>
      </div>
    </div>
  );
}

