"use client";

import { Star } from "lucide-react";

export default function ReviewPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 p-8 rounded-2xl border-2 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
        <div className="relative text-yellow-500">
          {/* Spinning circle */}
          <div className="w-20 h-20 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
          {/* Star icon in the center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500 animate-pulse" />
          </div>
        </div>
        <p className="text-lg font-semibold text-yellow-500">
          Loading Reviews...
        </p>
      </div>
    </div>
  );
}

