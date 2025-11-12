"use client";

import { useRouter } from "next/navigation";
import { Button } from "./button";
import { HelpCircle } from "lucide-react";

function SupportButton() {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      onClick={() => router.push("/support")}
      className="relative opacity-40 hover:opacity-100 transition-all duration-300 border border-transparent hover:border-red-500/30 bg-transparent hover:bg-red-500/5 group w-full justify-start text-muted-foreground/60 hover:text-red-400 mb-2"
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
      <span className="transition-colors duration-300">Support</span>
    </Button>
  );
}

export default SupportButton;

