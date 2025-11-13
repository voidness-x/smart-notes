"use client";

import { Settings } from "lucide-react";

type Props = {
  role: "admin" | "supervisor";
};

export default function ControlPageLoading({ role }: Props) {
  const isAdmin = role === "admin";
  const colorClass = isAdmin ? "text-red-500" : "text-green-500";
  const bgColorClass = isAdmin ? "bg-red-50 dark:bg-red-950/20" : "bg-green-50 dark:bg-green-950/20";
  const borderColorClass = isAdmin ? "border-red-200 dark:border-red-900" : "border-green-200 dark:border-green-900";
  const spinnerColorClass = isAdmin ? "border-red-500" : "border-green-500";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className={`flex flex-col items-center gap-6 p-8 rounded-2xl border-2 ${bgColorClass} ${borderColorClass}`}>
        <div className={`relative ${colorClass}`}>
          {/* Spinning circle */}
          <div className={`w-20 h-20 border-4 ${spinnerColorClass} border-t-transparent rounded-full animate-spin`}></div>
          {/* Settings icon in the center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Settings className={`w-8 h-8 ${colorClass} animate-pulse`} />
          </div>
        </div>
        <p className={`text-lg font-semibold ${colorClass}`}>
          Loading {isAdmin ? "Admin" : "Supervisor"} Panel...
        </p>
      </div>
    </div>
  );
}

