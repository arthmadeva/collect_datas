import { GetServerSideProps } from "next";
import { createPagesServerClient } from "@/utils/supabase/pages";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createPagesServerClient(context);
  
  // Verify session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  // Fetch role from user_profiles table
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  const role = profile?.role || session.user.user_metadata?.role || "cs";

  // Determine redirection path based on role
  let destination = "/cs/dashboard";
  if (role === "admin") {
    destination = "/admin/dashboard";
  } else if (role === "keuangan") {
    destination = "/keuangan/dashboard";
  } else if (role === "gudang") {
    destination = "/gudang/dashboard";
  }

  return {
    redirect: {
      destination,
      permanent: false,
    },
  };
};

export default function Index() {
  return null;
}
