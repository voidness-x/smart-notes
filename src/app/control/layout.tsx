import type { Metadata } from "next";
import "@/styles/globals.css";
import { Toaster } from "sonner"
import { ThemeProvider } from "@/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "Control Panel - Smart Notes",
  description: "Admin and Supervisor Control Panel",
};

export default function ControlLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="flex min-h-screen w-full flex-col">
        {children}
      </div>
      <Toaster />
    </ThemeProvider>
  );
}

