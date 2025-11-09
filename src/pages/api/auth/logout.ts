import type { APIRoute } from "astro";
import { logError } from "@/lib/logger";

export const prerender = false;

export const POST: APIRoute = async ({ locals }) => {
  if (!locals?.supabase) {
    logError("Supabase client is unavailable in POST /api/auth/logout");

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "SUPABASE_CLIENT_UNAVAILABLE",
          message: "Unable to complete sign out.",
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    const { error } = await locals.supabase.auth.signOut();

    if (error) {
      logError("Supabase sign out failed:", error);

      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "SIGN_OUT_FAILED",
            message: "Unable to sign out. Please try again.",
          },
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    logError("Unexpected error during sign out:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "UNEXPECTED_ERROR",
          message: "An unexpected error occurred. Please try again.",
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
