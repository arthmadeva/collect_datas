import { useState } from "react";
import { type GetServerSideProps } from "next";
import { createPagesServerClient } from "@/utils/supabase/pages-server";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/client";

interface KonfirmasiBeli {
  konfirmasi_id: number;
  verifikasi_id: number;
  created_at: string;
  beli: boolean;
  resep: string;
  nomor_sp: string;
  alamat_kirim: string;
  tanggal_kirim_frame: string;
  tanggal_kirim_lensa: string;
  cek_mutasi: boolean;
  id_form: string;
  verifikasi_kartu: {
    nama_cs: string;
    collect_data: {
      nama: string;
      email: string;
      nomor_kartu: string;
      no_hp: string;
      unit_bri: string;
      promotor: string;
    };
  };
}

interface AdminTransactionProps {
  user: {
    email: string;
    role: string;
    cabang: string;
  };
  initialHistory: KonfirmasiBeli[];
}

export default function AdminTransaction({ user, initialHistory }: AdminTransactionProps) {
  const supabase = createClient();
  const [history, setHistory] = useState<KonfirmasiBeli[]>(initialHistory);

  const refreshHistory = async () => {
    const { data, error } = await supabase
      .from("konfirmasi_beli")
      .select(`
        *,
        verifikasi_kartu!inner(
          nama_cs,
          collect_data!inner(*)
        )
      `)
      .eq("verifikasi_kartu.collect_data.cabang", user.cabang)
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
            <h1 className="text-2xl font-bold tracking-tight text-white">Admin Transaction History</h1>
            <p className="text-slate-400 text-sm mt-1">
              Riwayat konfirmasi pembelian konsumen untuk cabang <span className="text-indigo-400 font-semibold uppercase">{user.cabang}</span>.
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
            <p className="text-slate-400 text-sm">Belum ada riwayat konfirmasi pembelian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-900/35">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">ID Konfirmasi</th>
                  <th className="py-4 px-6">Konsumen</th>
                  <th className="py-4 px-6">Resep & SP</th>
                  <th className="py-4 px-6">Pengiriman</th>
                  <th className="py-4 px-6">Mutasi</th>
                  <th className="py-4 px-6">Status Beli</th>
                  <th className="py-4 px-6">Waktu Input</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-sm">
                {history.map((item) => (
                  <tr key={item.konfirmasi_id} className="hover:bg-slate-900/40 transition">
                    <td className="py-4 px-6 font-mono text-slate-400">#K-{item.konfirmasi_id}</td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-white">{item.verifikasi_kartu?.collect_data?.nama}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{item.verifikasi_kartu?.collect_data?.email}</div>
                      <div className="text-[11px] text-slate-450 mt-1">
                        Kartu: {item.verifikasi_kartu?.collect_data?.nomor_kartu.replace(/(\d{4})/g, "$1 ").trim()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-350">{item.resep || "-"}</div>
                      <div className="text-xs text-indigo-400 font-semibold mt-0.5">SP: {item.nomor_sp || "-"}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-300 text-xs truncate max-w-[150px]" title={item.alamat_kirim}>
                        {item.alamat_kirim || "-"}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Kirim: {item.tanggal_kirim_frame || "?"} (Frame) / {item.tanggal_kirim_lensa || "?"} (Lensa)
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {item.cek_mutasi ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Perlu Cek Mutasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Selesai
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {item.beli ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Beli (Deal)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Cancel
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

  const role = session.user.user_metadata?.role || "admin";
  const cabang = session.user.user_metadata?.cabang || "";

  if (role !== "admin") {
    return {
      redirect: {
        destination: `/${role}/dashboard`,
        permanent: false,
      },
    };
  }

  // Nested join fetching konfirmasi_beli for the admin's cabang
  const { data, error } = await supabase
    .from("konfirmasi_beli")
    .select(`
      *,
      verifikasi_kartu!inner(
        nama_cs,
        collect_data!inner(*)
      )
    `)
    .eq("verifikasi_kartu.collect_data.cabang", cabang)
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
