"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DispatchButtonProps = {
  incidentId: number;
};

export default function DispatchButton({
  incidentId,
}: DispatchButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDispatch() {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("incidents")
        .update({
          status: "dispatched",
        })
        .eq("id", incidentId)
        .eq("status", "new");

      if (error) {
        throw error;
      }

      window.location.reload();
    } catch (error: unknown) {
  console.error("Dispatch error:", error);

  if (error && typeof error === "object") {
    const supabaseError = error as {
      message?: string;
      code?: string;
      details?: string;
      hint?: string;
    };

    console.error("Message:", supabaseError.message);
    console.error("Code:", supabaseError.code);
    console.error("Details:", supabaseError.details);
    console.error("Hint:", supabaseError.hint);

    setError(
      supabaseError.message || "Unable to dispatch incident."
    );
  } else {
    setError("Unable to dispatch incident.");
  }
} finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleDispatch}
        disabled={isLoading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {isLoading ? "Dispatching..." : "Dispatch"}
      </button>

      {error && (
        <p className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}