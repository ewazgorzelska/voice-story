import type { APIRoute } from "astro";
import { logError } from "@/lib/logger";

export const DELETE: APIRoute = async ({ locals }) => {
  const {
    data: { user },
  } = await locals.supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { data: profile, error: profileError } = await locals.supabase
      .from("profiles")
      .select("scheduled_for_deletion_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    // If profile doesn't exist, create it
    if (!profile) {
      const { error: createError } = await locals.supabase
        .from("profiles")
        .insert({ user_id: user.id, voice_cloning_consent_given: false });

      if (createError) {
        throw createError;
      }
      // Now proceed with scheduling deletion on the newly created profile
    } else if (profile.scheduled_for_deletion_at) {
      // Profile exists and is already scheduled for deletion
      // Return success (idempotent behavior)
      return new Response(null, { status: 202 });
    }

    const { error } = await locals.supabase
      .from("profiles")
      .update({ scheduled_for_deletion_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return new Response(null, { status: 202 });
  } catch (error) {
    logError("Error scheduling account deletion:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
