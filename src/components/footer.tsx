"use client";

import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { HelpCircle, Star, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  const router = useRouter();

  return (
    <footer className="bg-background border-t py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-8 md:grid-cols-3 md:gap-12">
          {/* Logo and Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/Smart Notes.png"
                height={40}
                width={40}
                alt="Smart Notes Logo"
                className="rounded-full"
              />
              <span className="text-xl font-semibold">SMART NOTES</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Capture, organize, and enhance your ideas with AI-powered note-taking.
            </p>
          </div>

          {/* Contact Us */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3">
              <a
                href="mailto:smart.note.contact@gamil.com"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <Mail className="h-4 w-4 group-hover:scale-110 transition-transform" />
                <span className="hover:underline">smart.note.contact@gamil.com</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                onClick={() => router.push("/support")}
                className="relative opacity-80 hover:opacity-100 transition-all duration-300 border border-transparent hover:border-red-500/30 bg-transparent hover:bg-red-500/5 group justify-start text-muted-foreground hover:text-red-400 w-full md:w-auto"
                style={{
                  boxShadow: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <HelpCircle className="h-4 w-4 mr-2 fill-muted-foreground/30 text-muted-foreground/30 group-hover:fill-red-400 group-hover:text-red-400 group-hover:scale-110 transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                <span className="transition-colors duration-300">Contact Support</span>
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => router.push("/reviews")}
                className="relative opacity-80 hover:opacity-100 transition-all duration-300 border border-transparent hover:border-yellow-500/30 bg-transparent hover:bg-yellow-500/5 group justify-start text-muted-foreground hover:text-yellow-400 w-full md:w-auto"
                style={{
                  boxShadow: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 20px rgba(234, 179, 8, 0.5), 0 0 40px rgba(234, 179, 8, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Star className="h-4 w-4 mr-2 fill-muted-foreground/30 text-muted-foreground/30 group-hover:fill-yellow-400 group-hover:text-yellow-400 group-hover:scale-110 transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
                <span className="transition-colors duration-300">Review Us</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Smart Notes. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

