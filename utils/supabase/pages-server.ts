import { createServerClient, serializeCookieHeader } from "@supabase/ssr";
import { type GetServerSidePropsContext } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createPagesServerClient = (context: GetServerSidePropsContext) => {
  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return Object.entries(context.req.cookies).map(([name, value]) => ({
            name,
            value: value ?? "",
          }));
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              context.res.appendHeader(
                "Set-Cookie",
                serializeCookieHeader(name, value, options)
              );
            });
          } catch {
            // Can be ignored if res headers are already sent
          }
        },
      },
    }
  );
};
