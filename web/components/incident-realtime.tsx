"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function IncidentRealtime() {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("minicad-realtime")

      // Incident changes
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

      // Incident report changes
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incident_reports",
        },
        () => {
          window.location.reload();
        }
      )

      // Officer profile changes
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
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