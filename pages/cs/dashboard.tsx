import { useState } from "react";
import { type GetServerSideProps } from "next";
import { createPagesServerClient } from "@/utils/supabase/pages-server";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/router";
import { createClient } from "@/utils/supabase/client";

interface CollectData {
  transaksi_id: number;
  created_at: string;
  nama: string;
  email: string;
  tanggal_lahir: string;
  no_hp: string;
  nomor_kartu: string;
  unit_bri: string;
  promotor: string;
  cabang: string;
  verifikasi_kartu?: any[];
}

interface CsDashboardProps {
  user: {
    email: string;
    role: string;
    cabang: string;
  };
  initialQueue: CollectData[];
}

export default function CsDashboard({ user, initialQueue }: CsDashboardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [queue, setQueue] = useState<CollectData[]>(initialQueue);
  const [selectedTx, setSelectedTx] = useState<CollectData | null>(null);
  
  // Form State
  const [namaCs, setNamaCs] = useState("");
  const [tanggalTelepon, setTanggalTelepon] = useState(new Date().toISOString().split("T")[0]);
  const [jamTelepon, setJamTelepon] = useState("");
  const [plafon, setPlafon] = useState("");
  const [verifHp, setVerifHp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const refreshQueue = async () => {
    const { data, error } = await supabase
      .from("collect_data")
      .select("*, verifikasi_kartu(verifikasi_id)")
      .eq("cabang", user.cabang);

    if (!error && data) {
      const filtered = data.filter(
        (row: any) => !row.verifikasi_kartu || row.verifikasi_kartu.length === 0
      );
      setQueue(filtered);
    }
  };

  const handleOpenForm = (tx: CollectData) => {
    setSelectedTx(tx);
    setNamaCs("");
    setTanggalTelepon(new Date().toISOString().split("T")[0]);
    // current local time HH:MM
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setJamTelepon(`${hh}:${mm}`);
    setPlafon("");
    setVerifHp(false);
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;

    setSubmitting(true);
    setErrorMsg("");

    const { error } = await supabase.from("verifikasi_kartu").insert([
      {
        transaksi_id: selectedTx.transaksi_id,
        nama_cs: namaCs,
        tanggal_telepon: tanggalTelepon,
        jam_telepon: jamTelepon + ":00", // append seconds for Postgres time
        plafon: plafon,
        verif_hp: verifHp,
      },
    ]);

    if (error) {
      setErrorMsg(error.message);
      setSubmitting(false);
    } else {
      setSelectedTx(null);
      setSubmitting(false);
      // reload data
      await refreshQueue();
      // Optionally redirect to transactions
      router.push("/cs/transaction");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">CS Queue Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Daftar antrean transaksi baru cabang <span className="text-indigo-400 font-semibold uppercase">{user.cabang}</span> yang perlu diverifikasi.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 flex items-center space-x-3 self-start md:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
            <span className="text-xs font-semibold text-slate-300 font-mono">{queue.length} Antrean</span>
          </div>
        </div>

        {/* Table / List */}
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
            <svg
              className="w-12 h-12 text-slate-650 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-slate-400 text-sm">Tidak ada transaksi yang membutuhkan verifikasi kartu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-900/35">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Pelanggan</th>
                  <th className="py-4 px-6">No. HP</th>
                  <th className="py-4 px-6">Nomor Kartu</th>
                  <th className="py-4 px-6">Unit BRI / Promotor</th>
                  <th className="py-4 px-6">Tanggal Masuk</th>
                  <th className="py-4 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-sm">
                {queue.map((tx) => (
                  <tr key={tx.transaksi_id} className="hover:bg-slate-900/40 transition">
                    <td className="py-4 px-6 font-mono text-slate-400">#{tx.transaksi_id}</td>
                    <td className="py-4 px-6 font-medium text-white">
                      <div>{tx.nama}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{tx.email}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-300 font-mono">{tx.no_hp}</td>
                    <td className="py-4 px-6 text-slate-300 font-mono">
                      {tx.nomor_kartu.replace(/(\d{4})/g, "$1 ").trim()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-300">{tx.unit_bri}</div>
                      <div className="text-xs text-indigo-400 font-mono">{tx.promotor}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenForm(tx)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500 hover:bg-indigo-650 text-white transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
                      >
                        Verifikasi Kartu
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Form Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Form Verifikasi Kartu</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Transaksi #{selectedTx.transaksi_id} - {selectedTx.nama}
                </p>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs mb-4">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nama CS
                </label>
                <input
                  type="text"
                  value={namaCs}
                  onChange={(e) => setNamaCs(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                  placeholder="Nama Customer Service"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tanggal Telepon
                  </label>
                  <input
                    type="date"
                    value={tanggalTelepon}
                    onChange={(e) => setTanggalTelepon(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Jam Telepon
                  </label>
                  <input
                    type="time"
                    value={jamTelepon}
                    onChange={(e) => setJamTelepon(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Plafon Kartu
                </label>
                <input
                  type="text"
                  value={plafon}
                  onChange={(e) => setPlafon(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                  placeholder="e.g. 5000000"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="verifHp"
                  checked={verifHp}
                  onChange={(e) => setVerifHp(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-850"
                />
                <label htmlFor="verifHp" className="text-sm font-medium text-slate-350 select-none">
                  Verifikasi Nomor HP Berhasil (WhatsApp Aktif)
                </label>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-950 text-slate-300 font-medium text-sm transition text-center cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm transition shadow-lg shadow-indigo-500/10 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {submitting && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>Simpan Verifikasi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabase = createPagesServerClient(context);

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const role = session.user.user_metadata?.role || "cs";
  const cabang = session.user.user_metadata?.cabang || "";

  if (role !== "cs") {
    return {
      redirect: {
        destination: `/${role}/dashboard`,
        permanent: false,
      },
    };
  }

  // Fetch queue
  const { data, error } = await supabase
    .from("collect_data")
    .select("*, verifikasi_kartu(verifikasi_id)")
    .eq("cabang", cabang);

  const initialQueue = error || !data ? [] : data.filter(
    (row: any) => !row.verifikasi_kartu || row.verifikasi_kartu.length === 0
  );

  return {
    props: {
      user: {
        email: session.user.email,
        role,
        cabang,
      },
      initialQueue,
    },
  };
};
