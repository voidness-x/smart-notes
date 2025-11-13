"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/auth/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Hook to subscribe to real-time note changes via Supabase Realtime
 * This enables collaborative editing where changes from one user appear instantly to others
 */
export function useRealtimeNote(
  noteId: string | null,
  onNoteChange: (newText: string, newTitle?: string, newTags?: string[]) => void,
  enabled: boolean = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isLocalUpdateRef = useRef(false);

  useEffect(() => {
    // Only subscribe if noteId exists and real-time is enabled
    if (!noteId || !enabled) {
      // Cleanup if we had a previous subscription
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const supabase = createClient();

    // Subscribe to changes on the Note table for this specific note
    const channel = supabase
      .channel(`note:${noteId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Note",
          filter: `id=eq.${noteId}`,
        },
        (payload) => {
          // Ignore updates that we triggered ourselves
          if (isLocalUpdateRef.current) {
            return;
          }

          const newData = payload.new as {
            text?: string;
            title?: string;
            tags?: string[];
          };

          // Call the callback with the new data
          // Always pass text if available, otherwise pass empty string
          onNoteChange(
            newData.text || "",
            newData.title,
            newData.tags as string[] | undefined
          );
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`✅ Subscribed to real-time updates for note: ${noteId}`);
        } else if (status === "CHANNEL_ERROR") {
          console.error("❌ Error subscribing to real-time updates:", status);
        } else if (status === "TIMED_OUT") {
          console.warn("⏱️ Real-time subscription timed out for note:", noteId);
        } else if (status === "CLOSED") {
          console.log("🔌 Real-time subscription closed for note:", noteId);
        }
      });

    channelRef.current = channel;

    // Cleanup: unsubscribe when component unmounts or noteId changes
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [noteId, enabled, onNoteChange]);

  // Function to mark an update as local (to prevent circular updates)
  const markLocalUpdate = useCallback(() => {
    isLocalUpdateRef.current = true;
    // Reset after a short delay to allow the database update to complete
    setTimeout(() => {
      isLocalUpdateRef.current = false;
    }, 1000);
  }, []);

  return { markLocalUpdate };
}

