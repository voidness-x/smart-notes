"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/auth/client";
import { checkNoteUpdateAction } from "@/actions/notes";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Hook to subscribe to real-time note changes
 * Tries Supabase Realtime first, falls back to polling if Realtime is not available (free tier)
 * This enables collaborative editing where changes from one user appear to others
 */
export function useRealtimeNote(
  noteId: string | null,
  onNoteChange: (newText: string, newTitle?: string, newTags?: string[]) => void,
  enabled: boolean = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isLocalUpdateRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdatedAtRef = useRef<string>("");
  const useRealtimeRef = useRef(true); // Try Realtime first, fallback to polling if it fails

  // Polling function (fallback for free tier)
  const startPolling = useCallback(() => {
    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 2 seconds for updates
    pollingIntervalRef.current = setInterval(async () => {
      if (!noteId || isLocalUpdateRef.current) return;

      try {
        const result = await checkNoteUpdateAction(noteId, lastUpdatedAtRef.current || new Date(0).toISOString());
        
        if (result.hasUpdate && result.text !== undefined) {
          // Update last known update time
          if (result.updatedAt) {
            lastUpdatedAtRef.current = result.updatedAt;
          }
          
          // Call the callback with updated data
          onNoteChange(
            result.text || "",
            result.title,
            result.tags
          );
        }
      } catch (error) {
        console.error("Error polling for note updates:", error);
      }
    }, 2000); // Poll every 2 seconds

    console.log(`🔄 Using polling for note updates (every 2s): ${noteId}`);
  }, [noteId, onNoteChange]);

  useEffect(() => {
    // Only subscribe if noteId exists and real-time is enabled
    if (!noteId || !enabled) {
      // Cleanup if we had a previous subscription
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Initialize lastUpdatedAt on mount
    if (!lastUpdatedAtRef.current) {
      lastUpdatedAtRef.current = new Date().toISOString();
    }

    // Try Supabase Realtime first (requires paid plan)
    if (useRealtimeRef.current) {
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
            onNoteChange(
              newData.text || "",
              newData.title,
              newData.tags as string[] | undefined
            );
          }
        )
        .subscribe((status, err) => {
          if (status === "SUBSCRIBED") {
            console.log(`✅ Subscribed to real-time updates for note: ${noteId}`);
            useRealtimeRef.current = true; // Realtime is working
          } else if (status === "CHANNEL_ERROR") {
            console.warn("⚠️ Realtime not available (free tier), falling back to polling:", {
              status,
              error: err,
              noteId,
            });
            // Fallback to polling if Realtime fails (free tier)
            useRealtimeRef.current = false;
            startPolling();
          } else if (status === "TIMED_OUT") {
            console.warn("⏱️ Real-time subscription timed out, falling back to polling:", noteId);
            useRealtimeRef.current = false;
            startPolling();
          } else if (status === "CLOSED") {
            console.log("🔌 Real-time subscription closed for note:", noteId);
          }
        });

      channelRef.current = channel;
    } else {
      // Use polling fallback (for free tier)
      startPolling();
    }

    // Cleanup: unsubscribe when component unmounts or noteId changes
    return () => {
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [noteId, enabled, onNoteChange, startPolling]);

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

