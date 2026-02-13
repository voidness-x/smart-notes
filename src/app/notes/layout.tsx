import type { Metadata } from "next";
import "@/styles/globals.css";
import { Toaster } from "sonner"
import Header from "@/components/ui/Header"
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/ui/AppSidebar";
import NoteProvider from "@/providers/NoteProvider";
import { getUser } from "@/auth/server";

export const metadata: Metadata = {
  title: "Smart Notes",
  description: "A note app power by the advancments of A.I",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();

  return (
    <NoteProvider>
      <SidebarProvider>
        <div className="mr-[-1px]">
          <AppSidebar />
        </div>
        <div className="flex min-h-screen w-full flex-col overflow-hidden">
          <Header />

          <main className="flex flex-1 flex-col px-2 sm:px-4 pt-6 sm:pt-10 xl:px-8">
            {children}
          </main>
        </div>
      </SidebarProvider>

      <Toaster />
    </NoteProvider>
  );
}
