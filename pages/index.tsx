import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { createClient } from "@/utils/supabase/client";

export default function Login() {
  const router = useRouter();
  const supabase = createClient();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cs");
  const [cabang, setCabang] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Redirect users who are already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const metadata = session.user.user_metadata || {};
        const userRole = metadata.role || "cs";
        router.push(`/${userRole}/dashboard`);
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
    } else if (data.user) {
      const metadata = data.user.user_metadata || {};
      const userRole = metadata.role || "cs";
      setMessage({ type: "success", text: "Login sukses! Mengarahkan..." });
      setTimeout(() => {
        router.push(`/${userRole}/dashboard`);
      }, 1000);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if ((role === "admin" || role === "cs") && !cabang.trim()) {
      setMessage({ type: "error", text: "Cabang wajib diisi untuk Admin Cabang / CS" });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          cabang: role === "admin" || role === "cs" ? cabang.trim().toLowerCase() : null,
        },
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
    } else if (data.user) {
      setMessage({
        type: "success",
        text: "Registrasi berhasil! Silakan login dengan akun baru Anda.",
      });
      setIsSignUp(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 text-slate-100 px-4 relative overflow-hidden">
      {/* Visual background enhancements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-500/30 mb-3">
            A
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
            Akur Optic 55
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isSignUp ? "Registrasi Akun Baru" : "Centralized Transaction System"}
          </p>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm mb-6 border ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none text-slate-100 transition duration-150"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none text-slate-100 transition duration-150"
              placeholder="••••••••"
            />
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Role Keanggotaan
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none text-slate-100 transition duration-150"
                >
                  <option value="cs">Customer Service (CS)</option>
                  <option value="admin">Admin Cabang</option>
                  <option value="keuangan">Staf Keuangan</option>
                  <option value="gudang">Staf Gudang</option>
                </select>
              </div>

              {(role === "admin" || role === "cs") && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Cabang
                  </label>
                  <input
                    type="text"
                    value={cabang}
                    onChange={(e) => setCabang(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-850 hover:border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm focus:outline-none text-slate-100 transition duration-150"
                    placeholder="e.g. bandung, jakarta"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Semua nama cabang disimpan dalam huruf kecil
                  </span>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer mt-4"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            <span>{isSignUp ? "Sign Up" : "Sign In"}</span>
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage(null);
            }}
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition duration-150 cursor-pointer"
          >
            {isSignUp ? "Sudah punya akun? Masuk di sini" : "Belum punya akun? Daftar di sini"}
          </button>
        </div>
      </div>
    </div>
  );
}
