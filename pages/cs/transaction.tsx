import { useState } from "react";
import { type GetServerSideProps } from "next";
import { createPagesServerClient } from "@/utils/supabase/pages-server";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/client";

interface VerifikasiKartu {
  verifikasi_id: number;
  transaksi_id: number;
  created_at: string;
  nama_cs: string;
  tanggal_telepon: string;
  jam_telepon: string;
  plafon: string;
  verif_hp: boolean;
  collect_data: {
    nama: string;
    email: string;
    nomor_kartu: string;
    no_hp: string;
    unit_bri: string;
    promotor: string;
  };
}

interface CsTransactionProps {
  user: {
    email: string;
    role: string;
    cabang: string;
  };
  initialHistory: VerifikasiKartu[];
}

export default function CsTransaction({ user, initialHistory }: CsTransactionProps) {
  const supabase = createClient();
  const [history, setHistory] = useState<VerifikasiKartu[]>(initialHistory);

  const refreshHistory = async () => {
    const { data, error } = await supabase
      .from("verifikasi_kartu")
      .select("*, collect_data!inner(*)")
      .eq("collect_data.cabang", user.cabang)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setHistory(data as any[]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">CS Transaction History</h1>
            <p className="text-slate-400 text-sm mt-1">
              Riwayat verifikasi kartu konsumen untuk cabang <span className="text-indigo-400 font-semibold uppercase">{user.cabang}</span>.
            </p>
          </div>
          <button
            onClick={refreshHistory}
            className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-350 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8h-4.88" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {/* History Table */}
        {history.length === 0 ? (
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-slate-400 text-sm">Belum ada riwayat transaksi verifikasi kartu.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-900/35">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">ID Verifikasi</th>
                  <th className="py-4 px-6">Konsumen</th>
                  <th className="py-4 px-6">Nomor Kartu</th>
                  <th className="py-4 px-6">Detail Verifikasi</th>
                  <th className="py-4 px-6">Plafon</th>
                  <th className="py-4 px-6">Status HP</th>
                  <th className="py-4 px-6">Waktu Input</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-sm">
                {history.map((item) => (
                  <tr key={item.verifikasi_id} className="hover:bg-slate-900/40 transition">
                    <td className="py-4 px-6 font-mono text-slate-400">#V-{item.verifikasi_id}</td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-white">{item.collect_data?.nama}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{item.collect_data?.email}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-350 font-mono">
                      {item.collect_data?.nomor_kartu.replace(/(\d{4})/g, "$1 ").trim()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-300">CS: {item.nama_cs}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Tlp: {item.tanggal_telepon} pukul {item.jam_telepon.slice(0, 5)}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-indigo-400">
                      Rp {Number(item.plafon).toLocaleString("id-ID")}
                    </td>
                    <td className="py-4 px-6">
                      {item.verif_hp ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Terverifikasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Gagal
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-400">
                      {new Date(item.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
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

  // Query verifikasi_kartu with joined collect_data inner filtering by branch
  const { data, error } = await supabase
    .from("verifikasi_kartu")
    .select("*, collect_data!inner(*)")
    .eq("collect_data.cabang", cabang)
    .order("created_at", { ascending: false });

  return {
    props: {
      user: {
        email: session.user.email,
        role,
        cabang,
      },
      initialHistory: error || !data ? [] : data,
    },
  };
};
