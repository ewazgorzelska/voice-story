import type { SupabaseClient as OriginalSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export type SupabaseClient = OriginalSupabaseClient<Database>;
