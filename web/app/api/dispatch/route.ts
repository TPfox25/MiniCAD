import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createSupabaseAdminClient(
  supabaseUrl,
  serviceRoleKey
);

export async function POST(request: Request) {
  try {
    // Check the currently logged-in user.
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in." },
        { status: 401 }
      );
    }

    // Make sure the logged-in user is a dispatcher.
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Unable to verify your profile." },
        { status: 403 }
      );
    }

    if (profile.role !== "dispatcher") {
      return NextResponse.json(
        { error: "Only dispatchers can dispatch incidents." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const incidentId = Number(body.incidentId);

    if (!incidentId) {
      return NextResponse.json(
        { error: "Incident ID is required." },
        { status: 400 }
      );
    }

    // Update the incident to dispatched.
    const { data: incident, error: incidentError } =
      await supabase
        .from("incidents")
        .update({
          status: "dispatched",
          updated_at: new Date().toISOString(),
        })
        .eq("id", incidentId)
        .eq("status", "new")
        .select()
        .single();

    if (incidentError || !incident) {
      return NextResponse.json(
        {
          error:
            incidentError?.message ||
            "Incident could not be dispatched.",
        },
        { status: 400 }
      );
    }

    // Find officers who are currently on duty.
    const { data: officers, error: officersError } =
      await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("role", "officer")
        .eq("on_duty", true);

    if (officersError) {
      console.error(
        "Unable to find on-duty officers:",
        officersError
      );

      return NextResponse.json({
        success: true,
        incident,
        notificationSent: false,
        notificationError:
          "Incident dispatched, but officers could not be found.",
      });
    }

    if (!officers || officers.length === 0) {
      return NextResponse.json({
        success: true,
        incident,
        notificationSent: false,
        message: "Incident dispatched. No officers are currently on duty.",
      });
    }

    const officerIds = officers.map((officer) => officer.id);

    // Get push tokens for those officers.
    const { data: pushTokens, error: tokenError } =
      await supabaseAdmin
        .from("push_tokens")
        .select("user_id, token")
        .in("user_id", officerIds);

    if (tokenError) {
      console.error(
        "Unable to find push tokens:",
        tokenError
      );

      return NextResponse.json({
        success: true,
        incident,
        notificationSent: false,
        notificationError:
          "Incident dispatched, but push tokens could not be found.",
      });
    }

    if (!pushTokens || pushTokens.length === 0) {
      return NextResponse.json({
        success: true,
        incident,
        notificationSent: false,
        message:
          "Incident dispatched. No registered officer devices were found.",
      });
    }

    // Send the notification through Expo's push service.
    const messages = pushTokens.map((pushToken) => ({
      to: pushToken.token,
      sound: "default",
      title: "New Incident Dispatched",
      body: `${incident.incident_type} at ${incident.location}`,
      data: {
        incidentId: incident.id,
      },
    }));

    const expoResponse = await fetch(
      "https://exp.host/--/api/v2/push/send",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      }
    );

    const expoResult = await expoResponse.json();

    if (!expoResponse.ok) {
      console.error(
        "Expo push service error:",
        expoResult
      );

      return NextResponse.json({
        success: true,
        incident,
        notificationSent: false,
        notificationError:
          "Incident dispatched, but the push notification failed.",
      });
    }

    console.log("Expo push notification result:", expoResult);

    return NextResponse.json({
      success: true,
      incident,
      notificationSent: true,
    });
  } catch (error) {
    console.error("Dispatch API error:", error);

    return NextResponse.json(
      {
        error: "An unexpected error occurred while dispatching.",
      },
      { status: 500 }
    );
  }
}