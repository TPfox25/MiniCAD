"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function NewIncidentPage() {
  const router = useRouter();
  const supabase = createClient();

  const [callerName, setCallerName] = useState("");
  const [callerPhone, setCallerPhone] = useState("");
  const [location, setLocation] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);
    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to create an incident.");
      }

      const { error } = await supabase
        .from("incidents")
        .insert({
          caller_name: callerName,
          caller_phone: callerPhone,
          location: location,
          incident_type: incidentType,
          priority: priority,
          description: description,
          created_by: user.id,
        });

      if (error) {
        throw error;
      }

      router.push("/protected");
      router.refresh();
    } catch (error: unknown) {
      console.error("Create incident error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to create incident."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex-1 w-full p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">
            Create Incident
          </h1>

          <p className="mt-2 text-muted-foreground">
            Enter the details of the incident.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border p-6"
        >
          {/* Caller Name */}
          <div>
            <label
              htmlFor="callerName"
              className="mb-2 block text-sm font-medium"
            >
              Caller Name
            </label>

            <input
              id="callerName"
              type="text"
              value={callerName}
              onChange={(e) => setCallerName(e.target.value)}
              required
              className="w-full rounded-md border bg-transparent px-3 py-2"
              placeholder="Enter caller name"
            />
          </div>

          {/* Caller Phone */}
          <div>
            <label
              htmlFor="callerPhone"
              className="mb-2 block text-sm font-medium"
            >
              Caller Phone
            </label>

            <input
              id="callerPhone"
              type="tel"
              value={callerPhone}
              onChange={(e) => setCallerPhone(e.target.value)}
              required
              className="w-full rounded-md border bg-transparent px-3 py-2"
              placeholder="Enter caller phone"
            />
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="mb-2 block text-sm font-medium"
            >
              Location / Address
            </label>

            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full rounded-md border bg-transparent px-3 py-2"
              placeholder="Enter location"
            />
          </div>

          {/* Incident Type */}
          <div>
            <label
              htmlFor="incidentType"
              className="mb-2 block text-sm font-medium"
            >
              Incident Type
            </label>

            <input
              id="incidentType"
              type="text"
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              required
              className="w-full rounded-md border bg-transparent px-3 py-2"
              placeholder="e.g. Theft, Accident, Medical"
            />
          </div>

          {/* Priority */}
          <div>
            <label
              htmlFor="priority"
              className="mb-2 block text-sm font-medium"
            >
              Priority
            </label>

            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium"
            >
              Short Description
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full rounded-md border bg-transparent px-3 py-2"
              placeholder="Briefly describe what happened"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md border border-red-500 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/protected")}
              className="rounded-md border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isLoading ? "Creating..." : "Create Incident"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}