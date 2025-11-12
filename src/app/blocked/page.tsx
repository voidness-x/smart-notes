import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export default function BlockedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-md text-center space-y-4 sm:space-y-6 w-full">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4 sm:p-6">
            <ShieldAlert className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Account Blocked</h1>
          <p className="text-sm sm:text-base text-muted-foreground px-2">
            Your account has been blocked from accessing this website.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
          <p className="text-xs sm:text-sm text-muted-foreground px-2">
            If you believe this is an error, please contact our support team directly via email for assistance.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground px-2">
            Email: <a href="mailto:smart.note.contact@gamil.com" className="text-primary hover:underline">smart.note.contact@gamil.com</a>
          </p>
          
          <div className="flex flex-col gap-2 sm:gap-3 pt-2 sm:pt-4">
            <Button asChild variant="ghost" size="sm" className="text-sm sm:text-base">
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        </div>

        <div className="pt-6 sm:pt-8">
          <Link href="/" className="flex items-center justify-center gap-2">
            <Image
              src="/Smart Notes.png"
              height={40}
              width={40}
              alt="Smart Notes Logo"
              className="rounded-full h-8 w-8 sm:h-10 sm:w-10"
            />
            <span className="text-lg sm:text-xl font-semibold">SMART NOTES</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

