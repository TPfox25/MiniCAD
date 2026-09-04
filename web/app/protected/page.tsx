export const instant = false;

import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import DispatchButton from "@/components/dispatch-button";
import IncidentRealtime from "@/components/incident-realtime";

export default async function ProtectedPage() {
  const supabase = await createClient();

  // Check that the user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check the user's MiniCAD role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/auth/login");
  }

  // Only dispatchers can use this dashboard
  if (profile.role !== "dispatcher") {
    redirect("/auth/login");
  }

  // Get officers
  const { data: officers, error: officersError } = await supabase
    .from("profiles")
    .select("id, full_name, on_duty, last_seen_at")
    .eq("role", "officer")
    .order("full_name");

  // Get incidents
  const { data: incidents, error: incidentsError } = await supabase
    .from("incidents")
    .select(
      "id, caller_name, location, incident_type, priority, description, status, claimed_by, created_at"
    )
    .order("created_at", { ascending: false });

  // Get incident reports
  const { data: reports, error: reportsError } = await supabase
    .from("incident_reports")
    .select(
      "id, incident_id, officer_id, summary, outcome, resolved_at"
    )
    .order("resolved_at", { ascending: false });

  return (
    <main className="flex-1 w-full p-6">
      <IncidentRealtime />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          MiniCAD Dispatcher Dashboard
        </h1>

        <p className="mt-2 text-muted-foreground">
          Welcome, {profile.full_name}
        </p>
      </div>

      {/* Officers */}
      <section className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold">
          Officers
        </h2>

        {officersError ? (
          <p className="text-red-500">
            Unable to load officers.
          </p>
        ) : officers && officers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {officers.map((officer) => {
              const activeIncident = incidents?.find(
                (incident) =>
                  incident.claimed_by === officer.id &&
                  incident.status !== "resolved"
              );

              let officerStatus = "Off Duty / Not Logged In";

              if (officer.on_duty) {
                officerStatus = activeIncident
                  ? "Responding"
                  : "Available";
              }

              return (
                <div
                  key={officer.id}
                  className="rounded-lg border p-4"
                >
                  <h3 className="font-semibold">
                    {officer.full_name}
                  </h3>

                  <p className="mt-2 text-sm">
                    Status:{" "}
                    <span className="font-medium">
                      {officerStatus}
                    </span>
                  </p>

                  {activeIncident && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Current Incident:{" "}
                      {activeIncident.incident_type}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No officers found.
          </p>
        )}
      </section>

      {/* Incidents */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">
            Incidents
          </h2>

          <Link
            href="/protected/incidents/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Create Incident
          </Link>
        </div>

        {incidentsError ? (
          <p className="text-red-500">
            Unable to load incidents.
          </p>
        ) : incidents && incidents.length > 0 ? (
          <div className="space-y-4">
            {incidents.map((incident) => {
              const report = reports?.find(
                (item) => item.incident_id === incident.id
              );

              const officer = officers?.find(
                (item) => item.id === report?.officer_id
              );

              return (
                <div
                  key={incident.id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {incident.incident_type}
                      </h3>

                      <p className="text-sm text-muted-foreground">
                        {incident.location}
                      </p>
                    </div>

                    <div className="flex gap-2 text-sm">
                      <span className="rounded border px-2 py-1">
                        {incident.priority}
                      </span>

                      <span className="rounded border px-2 py-1">
                        {incident.status}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-sm">
                    {incident.description}
                  </p>

                  <p className="mt-2 text-sm text-muted-foreground">
                    Caller: {incident.caller_name}
                  </p>

                  {incident.status === "new" && (
                    <div className="mt-4">
                      <DispatchButton
                        incidentId={incident.id}
                      />
                    </div>
                  )}

                  {/* Incident Report */}
                  {report && (
                    <div className="mt-5 rounded-lg border bg-muted/30 p-4">
                      <h4 className="mb-3 font-semibold">
                        Incident Report
                      </h4>

                      <div className="space-y-2 text-sm">
                        <p>
                          <span className="font-medium">
                            Officer:
                          </span>{" "}
                          {officer?.full_name ??
                            "Unknown officer"}
                        </p>

                        <p>
                          <span className="font-medium">
                            Summary:
                          </span>{" "}
                          {report.summary}
                        </p>

                        <p>
                          <span className="font-medium">
                            Outcome:
                          </span>{" "}
                          {report.outcome}
                        </p>

                        <p>
                          <span className="font-medium">
                            Time Resolved:
                          </span>{" "}
                          {new Date(
                            report.resolved_at
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border p-6 text-center">
            <p className="text-muted-foreground">
              No incidents have been created yet.
            </p>
          </div>
        )}
      </section>

      {reportsError && (
        <p className="mt-4 text-sm text-red-500">
          Unable to load incident reports.
        </p>
      )}
    </main>
  );
}