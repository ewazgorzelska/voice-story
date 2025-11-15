/// <reference types="astro/client" />

import type { Session } from "@supabase/supabase-js";
import type { SupabaseClient } from "./db";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      session?: Session;
      user?: {
        id: string;
        email: string | null;
      };
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly ELEVENLABS_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
