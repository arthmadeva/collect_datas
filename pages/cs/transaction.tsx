import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

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
    no_hp: string;
    nomor_kartu: string;
    unit_bri: string;
    promotor: string;
    cabang: string;
  };
}

export default function CSTransaction() {
  const [history, setHistory] = useState<VerifikasiKartu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/verifikasi-kartu");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal mengambil riwayat transaksi");
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
    <DashboardLayout activePage="transaction" role="cs" title="Riwayat Verifikasi Kartu">
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
            Cabang Anda belum memiliki data verifikasi kartu yang tercatat.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/70 border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Tgl Verifikasi</th>
                  <th className="px-6 py-4">Nama Konsumen</th>
                  <th className="px-6 py-4">Nomor Kartu</th>
                  <th className="px-6 py-4">Nama CS</th>
                  <th className="px-6 py-4">Plafon</th>
                  <th className="px-6 py-4">Status HP</th>
                  <th className="px-6 py-4">Waktu Telepon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm text-slate-200">
                {history.map((row) => (
                  <tr key={row.verifikasi_id} className="hover:bg-slate-900/20 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {new Date(row.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.collect_data ? (
                        <>
                          <div className="font-semibold text-white">{row.collect_data.nama}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{row.collect_data.email}</div>
                        </>
                      ) : (
                        <span className="text-rose-400 italic">Data Dihapus</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono tracking-wide text-slate-300">
                      {row.collect_data?.nomor_kartu || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300 font-medium">
                      {row.nama_cs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-emerald-400 font-semibold">
                      Rp {Number(row.plafon).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.verif_hp ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Aktif (OK)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Tidak Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">
                      {row.tanggal_telepon} | {row.jam_telepon.substring(0, 5)}
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
