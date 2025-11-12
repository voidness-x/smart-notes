import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logged Out - Smart Notes",
  description: "You have been logged out",
};

export default function LogoutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

