import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/register",
  "/auth/forgot-password",
  "/auth/reset",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/password-reset",
  "/api/auth/password-update",
  "/api/stories", // Public endpoint - browse stories without auth
]);

const isPublicAssetRequest = (pathname: string) => {
  return (
    pathname.startsWith("/_astro/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/public/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  );
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, locals, cookies, request, redirect } = context;

  if (isPublicAssetRequest(url.pathname)) {
    return next();
  }

  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  locals.supabase = supabase;

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) {
    locals.session = sessionData.session;
  }

  const { data: userData } = await supabase.auth.getUser();

  if (userData.user) {
    locals.user = {
      id: userData.user.id,
      email: userData.user.email ?? null,
    };

    return next();
  }

  if (PUBLIC_PATHS.has(url.pathname)) {
    return next();
  }

  return redirect("/login");
});
