"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function IncidentRealtime() {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("incidents-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incidents",
        },
        () => {
          window.location.reload();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}