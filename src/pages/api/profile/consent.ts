import type { APIRoute } from "astro";
import { logError } from "@/lib/logger";

export const POST: APIRoute = async ({ locals }) => {
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
    // First check if profile exists
    const { data: existingProfile } = await locals.supabase
      .from("profiles")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    // If profile doesn't exist, create it with consent = true
    if (!existingProfile) {
      const { error: insertError } = await locals.supabase
        .from("profiles")
        .insert({ user_id: user.id, voice_cloning_consent_given: true });

      if (insertError) {
        throw insertError;
      }
    } else {
      // Profile exists, update it
      const { error: updateError } = await locals.supabase
        .from("profiles")
        .update({ voice_cloning_consent_given: true })
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    logError("Error updating profile consent:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
