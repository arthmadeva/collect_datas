import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface KonfirmasiBeli {
  konfirmasi_id: number;
  verifikasi_id: number;
  created_at: string;
  beli: boolean;
  resep: string | null;
  nomor_sp: string | null;
  alamat_kirim: string | null;
  tanggal_kirim_frame: string | null;
  tanggal_kirim_lensa: string | null;
  cek_mutasi: boolean;
  id_form: string;
  verifikasi_kartu: {
    nama_cs: string;
    collect_data: {
      nama: string;
      nomor_kartu: string;
      cabang: string;
    };
  };
}

export default function AdminTransaction() {
  const [history, setHistory] = useState<KonfirmasiBeli[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/konfirmasi-beli");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal mengambil riwayat konfirmasi");
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
    <DashboardLayout activePage="transaction" role="admin" title="Riwayat Konfirmasi Pembelian">
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
            Cabang Anda belum memiliki data konfirmasi pembelian yang tercatat.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/70 border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Tgl Konfirmasi</th>
                  <th className="px-6 py-4">ID Form</th>
                  <th className="px-6 py-4">Nama Konsumen</th>
                  <th className="px-6 py-4">Status Beli</th>
                  <th className="px-6 py-4">Nomor SP</th>
                  <th className="px-6 py-4">Cek Mutasi</th>
                  <th className="px-6 py-4">Kirim Lensa/Frame</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm text-slate-200">
                {history.map((row) => (
                  <tr key={row.konfirmasi_id} className="hover:bg-slate-900/20 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {new Date(row.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-indigo-400 font-bold font-mono">
                      {row.id_form}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.verifikasi_kartu?.collect_data ? (
                        <>
                          <div className="font-semibold text-white">
                            {row.verifikasi_kartu.collect_data.nama}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 font-mono">
                            {row.verifikasi_kartu.collect_data.nomor_kartu}
                          </div>
                        </>
                      ) : (
                        <span className="text-rose-400 italic">Data Dihapus</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.beli ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Beli (Deal)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Batal / Tidak
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300 font-mono">
                      {row.nomor_sp || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.cek_mutasi ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Ya (Wajib Cek)
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/50">
                          Tidak
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                      {row.beli ? (
                        <>
                          <div>Frame: {row.tanggal_kirim_frame || "-"}</div>
                          <div className="mt-0.5">Lensa: {row.tanggal_kirim_lensa || "-"}</div>
                        </>
                      ) : (
                        "-"
                      )}
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
