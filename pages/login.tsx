import { useState } from "react";
import { useRouter } from "next/router";
import { createClient } from "@/utils/supabase/client";

export default function Login() {
  const router = useRouter();
  const supabase = createClient();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("cs");
  const [cabang, setCabang] = useState("bandung");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // Sign Up Flow
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              cabang: role === "admin" || role === "cs" ? cabang : null,
            },
          },
        });

        if (error) throw error;

        if (data?.user) {
          // Fallback manual profile insertion if trigger is not set up yet
          await supabase.from("user_profiles").upsert({
            id: data.user.id,
            role,
            cabang: role === "admin" || role === "cs" ? cabang : null,
          });

          setMessage({
            type: "success",
            text: "Registrasi berhasil! Silakan periksa email Anda untuk verifikasi atau coba login langsung jika konfirmasi otomatis aktif.",
          });
          setIsSignUp(false);
        }
      } else {
        // Sign In Flow
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data?.session) {
          setMessage({ type: "success", text: "Login berhasil! Mengalihkan..." });
          
          // Fetch profile to redirect
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("role")
            .eq("id", data.session.user.id)
            .single();

          const userRole = profile?.role || data.session.user.user_metadata?.role || "cs";

          if (userRole === "admin") {
            router.push("/admin/dashboard");
          } else if (userRole === "keuangan") {
            router.push("/keuangan/dashboard");
          } else if (userRole === "gudang") {
            router.push("/gudang/dashboard");
          } else {
            router.push("/cs/dashboard");
          }
        }
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center relative overflow-hidden px-4 py-12">
      {/* Decorative gradient glowing circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse duration-5000"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-indigo-500 text-white font-bold text-2xl shadow-lg shadow-teal-500/20 mb-3">
            AK
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Akur Optic 55</h2>
          <p className="text-slate-400 text-sm mt-1">Sistem Manajemen Transaksi Terintegrasi</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {message && (
            <div
              className={`p-4 rounded-xl border text-sm ${
                message.type === "success"
                  ? "bg-teal-950/40 border-teal-800/50 text-teal-200"
                  : "bg-rose-950/40 border-rose-800/50 text-rose-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white rounded-lg px-4 py-2.5 outline-none transition"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white rounded-lg px-4 py-2.5 outline-none transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-1.5">Role Akses</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white rounded-lg px-4 py-2.5 outline-none transition"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="cs">Customer Service (CS)</option>
                  <option value="admin">Admin Cabang</option>
                  <option value="keuangan">Staf Keuangan</option>
                  <option value="gudang">Staf Gudang</option>
                </select>
              </div>

              {(role === "cs" || role === "admin") && (
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">Wilayah Cabang</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white rounded-lg px-4 py-2.5 outline-none transition"
                    value={cabang}
                    onChange={(e) => setCabang(e.target.value)}
                  >
                    <option value="bandung">Bandung</option>
                    <option value="jakarta">Jakarta</option>
                    <option value="klaten">Klaten</option>
                    <option value="surabaya">Surabaya</option>
                    <option value="medan">Medan</option>
                  </select>
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-semibold rounded-lg px-4 py-2.5 transition duration-200 transform active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 shadow-lg shadow-teal-500/20"
          >
            {loading ? "Memproses..." : isSignUp ? "Daftar Akun Baru" : "Masuk Aplikasi"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {isSignUp ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-teal-400 hover:text-teal-300 font-semibold focus:outline-none transition"
          >
            {isSignUp ? "Masuk di sini" : "Daftar di sini"}
          </button>
        </div>
      </div>
    </div>
  );
}
