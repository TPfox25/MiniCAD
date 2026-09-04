"use client";

import { useState } from "react";

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
      const response = await fetch("/api/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          incidentId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to dispatch incident."
        );
      }

      window.location.reload();
    } catch (error: unknown) {
      console.error("Dispatch error:", error);

      if (error instanceof Error) {
        setError(error.message);
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