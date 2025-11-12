import type { Metadata } from "next";
import "@/styles/globals.css";
import { Toaster } from "sonner"
import Header from "@/components/ui/Header"
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/ui/AppSidebar";
import NoteProvider from "@/providers/NoteProvider";

export const metadata: Metadata = {
  title: "Support - Smart Notes",
  description: "Get help with Smart Notes",
};

export default function SupportLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NoteProvider>
      <SidebarProvider>
        <div className="mr-[-1px]">
          <AppSidebar />
        </div>
        <div className="flex min-h-screen w-full flex-col overflow-hidden">
          <Header />

          <main className="flex flex-1 flex-col px-4 pt-10 xl:px-8">
            {children}
          </main>
        </div>
      </SidebarProvider>
      
      <Toaster />
    </NoteProvider>
  );
}

