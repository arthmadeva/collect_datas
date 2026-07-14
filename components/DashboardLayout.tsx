import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activePage: "dashboard" | "transaction";
  role: "admin" | "cs" | "keuangan" | "gudang";
  title: string;
}

export default function DashboardLayout({ children, activePage, role, title }: DashboardLayoutProps) {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState("");
  const [cabang, setCabang] = useState<string | null>(null);

  useEffect(() => {
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUserEmail(session.user.email || "");
      
      // Fetch profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("cabang")
        .eq("id", session.user.id)
        .single();
      
      setCabang(profile?.cabang || session.user.user_metadata?.cabang || null);
    }
    getSession();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const getRoleName = () => {
    switch (role) {
      case "admin":
        return "Admin Cabang";
      case "cs":
        return "Customer Service (CS)";
      case "keuangan":
        return "Staf Keuangan";
      case "gudang":
        return "Staf Gudang";
      default:
        return role;
    }
  };

  const roleBaseUrl = `/${role}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/75 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-teal-500/10">
            AK
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide text-white leading-tight">Akur Optic 55</h1>
            <p className="text-xs text-slate-400">Centralized Transaction Manager</p>
          </div>
        </div>

        {/* User Badges */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-sm font-medium text-slate-200">{userEmail}</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/20">
                {getRoleName()}
              </span>
              {cabang && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 capitalize">
                  Cabang: {cabang}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg border border-slate-700/50 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900/30 md:border-r border-slate-800/80 p-6 flex flex-col space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Main Menu</span>
          
          <Link
            href={`${roleBaseUrl}/dashboard`}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
              activePage === "dashboard"
                ? "bg-gradient-to-r from-teal-500/15 to-indigo-500/5 text-teal-400 border border-teal-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span>To-Do List Antrean</span>
          </Link>

          <Link
            href={`${roleBaseUrl}/transaction`}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
              activePage === "transaction"
                ? "bg-gradient-to-r from-teal-500/15 to-indigo-500/5 text-teal-400 border border-teal-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Riwayat Transaksi</span>
          </Link>
        </aside>

        {/* Page Container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {/* Header Title */}
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
              <p className="text-slate-400 text-sm mt-1">Kelola data alur kerja relasional dengan mudah</p>
            </div>
            {/* Visual glow indicator */}
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-1.5 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Sistem Terhubung</span>
            </div>
          </div>

          {/* Children Pages */}
          {children}
        </main>
      </div>
    </div>
  );
}
