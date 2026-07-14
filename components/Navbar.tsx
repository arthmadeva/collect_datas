import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { createClient } from "@/utils/supabase/client";

interface NavbarProps {
  user: {
    email?: string;
    role?: string;
    cabang?: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getDashboardPath = (role?: string) => {
    if (role === "admin") return "/admin/dashboard";
    if (role === "cs") return "/cs/dashboard";
    if (role === "keuangan") return "/keuangan/dashboard";
    if (role === "gudang") return "/gudang/dashboard";
    return "/";
  };

  const getTransactionPath = (role?: string) => {
    if (role === "admin") return "/admin/transaction";
    if (role === "cs") return "/cs/transaction";
    if (role === "keuangan") return "/keuangan/transaction";
    if (role === "gudang") return "/gudang/transaction";
    return "/";
  };

  const isActive = (path: string) => router.pathname === path;

  const dashboardPath = getDashboardPath(user.role);
  const transactionPath = getTransactionPath(user.role);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      {/* Brand / Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
          A
        </div>
        <div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-400">
            Akur Optic 55
          </span>
          <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-indigo-400 bg-indigo-500/10 rounded-full border border-indigo-500/20">
            AKUR
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center space-x-1">
        <Link
          href={dashboardPath}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive(dashboardPath)
              ? "bg-slate-800 text-white shadow-sm border border-slate-700"
              : "text-slate-400 hover:text-white hover:bg-slate-900/50"
          }`}
        >
          Dashboard (Queue)
        </Link>
        <Link
          href={transactionPath}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            isActive(transactionPath)
              ? "bg-slate-800 text-white shadow-sm border border-slate-700"
              : "text-slate-400 hover:text-white hover:bg-slate-900/50"
          }`}
        >
          Transaction (History)
        </Link>
      </div>

      {/* User Info & Actions */}
      <div className="flex items-center space-x-4">
        <div className="flex flex-col text-right">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">{user.email}</span>
          <span className="text-xs font-semibold text-indigo-400 capitalize">
            {user.role} {user.cabang ? `(${user.cabang})` : ""}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium border border-rose-500/30 text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/50 transition-all duration-200 shadow-sm shadow-rose-500/5 cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
