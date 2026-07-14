import { useState } from "react";
import { type GetServerSideProps } from "next";
import { createPagesServerClient } from "@/utils/supabase/pages-server";
import Navbar from "@/components/Navbar";
import { createClient } from "@/utils/supabase/client";

interface PostProduksi {
  post_id: number;
  pra_id: number;
  created_at: string;
  no_faktur: string;
  sudah_produksi: boolean;
  petugas_produksi: string;
  tanggal_selesai_produksi: string;
  proses_pengiriman: boolean;
  quality_control: boolean;
  resi_pengiriman: string;
  pra_produksi: {
    konfirmasi_beli: {
      verifikasi_kartu: {
        collect_data: {
          nama: string;
          nomor_kartu: string;
          cabang: string;
        };
      };
    };
  };
}

interface GudangTransactionProps {
  user: {
    email: string;
    role: string;
    cabang: string;
  };
  initialHistory: PostProduksi[];
}

export default function GudangTransaction({ user, initialHistory }: GudangTransactionProps) {
  const supabase = createClient();
  const [history, setHistory] = useState<PostProduksi[]>(initialHistory);

  const refreshHistory = async () => {
    const { data, error } = await supabase
      .from("post_produksi")
      .select(`
        *,
        pra_produksi!inner(
          pra_id,
          konfirmasi_beli!inner(
            konfirmasi_id,
            verifikasi_kartu!inner(
              verifikasi_id,
              collect_data!inner(
                nama,
                nomor_kartu,
                cabang
              )
            )
          )
        )
      `)
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
            <h1 className="text-2xl font-bold tracking-tight text-white">Gudang Transaction History</h1>
            <p className="text-slate-400 text-sm mt-1">
              Riwayat penyelesaian produksi kacamata dan detail pengiriman logistik secara nasional.
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
            <p className="text-slate-400 text-sm">Belum ada riwayat transaksi logistik gudang.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-900/35">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">ID Post</th>
                  <th className="py-4 px-6">Konsumen</th>
                  <th className="py-4 px-6">Cabang asal</th>
                  <th className="py-4 px-6">Faktur / Petugas</th>
                  <th className="py-4 px-6">Status Produksi & QC</th>
                  <th className="py-4 px-6">Nomor Resi</th>
                  <th className="py-4 px-6">Tanggal Input</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850/60 text-sm">
                {history.map((item) => {
                  const client = item.pra_produksi?.konfirmasi_beli?.verifikasi_kartu?.collect_data;
                  return (
                    <tr key={item.post_id} className="hover:bg-slate-900/40 transition">
                      <td className="py-4 px-6 font-mono text-slate-450">#O-{item.post_id}</td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-white">{client?.nama || "-"}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          Kartu: {client?.nomor_kartu.replace(/(\d{4})/g, "$1 ").trim() || "-"}
                        </div>
                      </td>
                      <td className="py-4 px-6 uppercase font-semibold text-xs text-indigo-400">
                        {client?.cabang || "-"}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-slate-300 font-semibold">FAKTUR-{item.no_faktur}</div>
                        <div className="text-xs text-slate-500 mt-0.5">Staf: {item.petugas_produksi}</div>
                      </td>
                      <td className="py-4 px-6 space-y-1">
                        <div>
                          {item.sudah_produksi ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Produksi OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              Produksi Pending
                            </span>
                          )}
                        </div>
                        <div>
                          {item.quality_control ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              QC Pass
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              QC Fail
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono">
                        {item.resi_pengiriman ? (
                          <div className="space-y-1">
                            <div className="text-indigo-400 font-semibold text-xs">{item.resi_pengiriman}</div>
                            {item.proses_pengiriman && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                Sedang Dikirim
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-xs">Belum Dikirim</span>
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
                  );
                })}
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

  const role = session.user.user_metadata?.role || "gudang";

  if (role !== "gudang") {
    return {
      redirect: {
        destination: `/${role}/dashboard`,
        permanent: false,
      },
    };
  }

  // Query post_produksi with cascading joins
  const { data, error } = await supabase
    .from("post_produksi")
    .select(`
      *,
      pra_produksi!inner(
        pra_id,
        konfirmasi_beli!inner(
          konfirmasi_id,
          verifikasi_kartu!inner(
            verifikasi_id,
            collect_data!inner(
              nama,
              nomor_kartu,
              cabang
            )
          )
        )
      )
    `)
    .order("created_at", { ascending: false });

  return {
    props: {
      user: {
        email: session.user.email,
        role,
        cabang: "",
      },
      initialHistory: error || !data ? [] : data,
    },
  };
};
