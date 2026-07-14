import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface AktualRecord {
  aktual_id: number;
  konfirmasi_id: number;
  created_at: string;
  actual: string;
  acc_pusat_actual: boolean;
  no_acc_pusat_actual: string;
  konfirmasi_beli: {
    id_form: string;
    verifikasi_kartu: {
      collect_data: {
        nama: string;
        nomor_kartu: string;
        cabang: string;
      };
    };
  };
}

export default function KeuanganTransaction() {
  const [history, setHistory] = useState<AktualRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/aktual");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal mengambil riwayat keuangan");
      }
      const data = await res.json();
      setHistory(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <DashboardLayout activePage="transaction" role="keuangan" title="Riwayat Aktual Keuangan">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-950/30 border border-rose-800/50 rounded-xl text-rose-300 text-sm">
          Error: {error}
        </div>
      ) : history.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-slate-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Belum Ada Riwayat</h3>
          <p className="text-slate-400 text-sm">
            Belum ada riwayat aktual pembayaran kacamata yang tercatat di keuangan.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/70 border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Tgl Aktual</th>
                  <th className="px-6 py-4">ID Form</th>
                  <th className="px-6 py-4">Nama Konsumen</th>
                  <th className="px-6 py-4">Cabang</th>
                  <th className="px-6 py-4">Pencairan Aktual</th>
                  <th className="px-6 py-4">Status ACC</th>
                  <th className="px-6 py-4">No. ACC Pusat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm text-slate-200">
                {history.map((row) => (
                  <tr key={row.aktual_id} className="hover:bg-slate-900/20 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {new Date(row.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-indigo-400 font-bold font-mono">
                      {row.konfirmasi_beli?.id_form || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.konfirmasi_beli?.verifikasi_kartu?.collect_data ? (
                        <>
                          <div className="font-semibold text-white">
                            {row.konfirmasi_beli.verifikasi_kartu.collect_data.nama}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">
                            {row.konfirmasi_beli.verifikasi_kartu.collect_data.nomor_kartu}
                          </div>
                        </>
                      ) : (
                        <span className="text-rose-400 italic">Data Dihapus</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize text-slate-300">
                      {row.konfirmasi_beli?.verifikasi_kartu?.collect_data?.cabang || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-emerald-400">
                      Rp {Number(row.actual).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.acc_pusat_actual ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ACC Pusat
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Menunggu ACC
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-300">
                      {row.no_acc_pusat_actual || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
