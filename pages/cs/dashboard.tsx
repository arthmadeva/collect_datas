import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

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
}

export default function CSDashboard() {
  const [queue, setQueue] = useState<CollectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedTx, setSelectedTx] = useState<CollectData | null>(null);
  const [namaCs, setNamaCs] = useState("");
  const [tanggalTelepon, setTanggalTelepon] = useState("");
  const [jamTelepon, setJamTelepon] = useState("");
  const [plafon, setPlafon] = useState("");
  const [verifHp, setVerifHp] = useState(true);
  const [formSubmitLoading, setFormSubmitLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch Queue
  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/collect-data?queue=true");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal mengambil data antrean");
      }
      const data = await res.json();
      setQueue(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const openForm = (tx: CollectData) => {
    setSelectedTx(tx);
    setNamaCs("");
    
    // Set default values for date and time
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    const formattedTime = today.toTimeString().split(" ")[0].substring(0, 5); // HH:MM
    
    setTanggalTelepon(formattedDate);
    setJamTelepon(formattedTime);
    setPlafon("");
    setVerifHp(true);
    setFormError(null);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;

    setFormSubmitLoading(true);
    setFormError(null);

    try {
      const res = await fetch("/api/verifikasi-kartu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaksi_id: selectedTx.transaksi_id,
          nama_cs: namaCs,
          tanggal_telepon: tanggalTelepon,
          jam_telepon: jamTelepon + ":00", // Append seconds for SQL compatibility
          plafon,
          verif_hp: verifHp,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan verifikasi");
      }

      // Close modal and refresh queue
      setSelectedTx(null);
      fetchQueue();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormSubmitLoading(false);
    }
  };

  return (
    <DashboardLayout activePage="dashboard" role="cs" title="Antrean Verifikasi CS">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-950/30 border border-rose-800/50 rounded-xl text-rose-300 text-sm">
          Error: {error}
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-slate-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Antrean Bersih!</h3>
          <p className="text-slate-400 text-sm">
            Semua data collect saat ini telah selesai diverifikasi oleh CS cabang Anda.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/70 border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Tgl Collect</th>
                  <th className="px-6 py-4">Nama Konsumen</th>
                  <th className="px-6 py-4">No. HP</th>
                  <th className="px-6 py-4">No. Kartu</th>
                  <th className="px-6 py-4">Unit BRI / Promotor</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm text-slate-200">
                {queue.map((row) => (
                  <tr key={row.transaksi_id} className="hover:bg-slate-900/20 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                      {new Date(row.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{row.nama}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{row.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300">{row.no_hp}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-300 font-mono tracking-wide">
                      {row.nomor_kartu}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-300">{row.unit_bri}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Promotor: {row.promotor}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => openForm(row)}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition shadow-md shadow-teal-500/10 cursor-pointer"
                      >
                        Verifikasi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Form Verifikasi Kartu</h3>
            <p className="text-xs text-slate-400 mb-5">
              Konsumen: <span className="font-semibold text-teal-400">{selectedTx.nama}</span> | Kartu: <span className="font-mono text-indigo-400">{selectedTx.nomor_kartu}</span>
            </p>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-200 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="nama_cs">
                  Nama CS Pemeriksa
                </label>
                <input
                  id="nama_cs"
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                  placeholder="Masukkan nama CS..."
                  value={namaCs}
                  onChange={(e) => setNamaCs(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="tgl_telp">
                    Tanggal Telepon
                  </label>
                  <input
                    id="tgl_telp"
                    type="date"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                    value={tanggalTelepon}
                    onChange={(e) => setTanggalTelepon(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="jam_telp">
                    Jam Telepon
                  </label>
                  <input
                    id="jam_telp"
                    type="time"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                    value={jamTelepon}
                    onChange={(e) => setJamTelepon(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="plafon">
                  Plafon Kartu (Rupiah)
                </label>
                <input
                  id="plafon"
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                  placeholder="Contoh: 1500000"
                  value={plafon}
                  onChange={(e) => setPlafon(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 mt-2">
                <input
                  id="verif_hp"
                  type="checkbox"
                  className="h-4.5 w-4.5 rounded border-slate-800 text-teal-600 focus:ring-teal-500 bg-slate-900 transition"
                  checked={verifHp}
                  onChange={(e) => setVerifHp(e.target.checked)}
                />
                <label htmlFor="verif_hp" className="text-slate-300 text-xs select-none">
                  <div className="font-semibold text-white">Nomor HP Terverifikasi</div>
                  <div className="text-slate-400 mt-0.5">Sudah memvalidasi keaktifan HP konsumen</div>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedTx(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitLoading}
                  className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white rounded-lg transition disabled:opacity-50"
                >
                  {formSubmitLoading ? "Menyimpan..." : "Kirim Verifikasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
