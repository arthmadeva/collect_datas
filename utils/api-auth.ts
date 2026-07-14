import { NextApiRequest, NextApiResponse } from "next";
import { createPagesApiClient } from "@/utils/supabase/pages";

export interface AuthenticatedUser {
  id: string;
  role: string;
  cabang: string | null;
}

export async function verifyApiAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedRoles?: string[]
) {
  const supabase = createPagesApiClient(req, res);
  
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    res.status(401).json({ error: "Unauthorized. Session not found." });
    return null;
  }

  // Fetch role and cabang from user_profiles table
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("role, cabang")
    .eq("id", session.user.id)
    .single();

  let userRole = profile?.role;
  let userCabang = profile?.cabang;

  if (profileError || !profile) {
    // Fallback to user metadata
    userRole = session.user.user_metadata?.role;
    userCabang = session.user.user_metadata?.cabang;

    if (!userRole) {
      res.status(403).json({ error: "Access denied. Profile not found." });
      return null;
    }
  }

  const user: AuthenticatedUser = {
    id: session.user.id,
    role: userRole,
    cabang: userCabang || null,
  };

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    res.status(403).json({ error: `Access denied. Role [${user.role}] is not authorized.` });
    return null;
  }

  return { supabase, user };
}
