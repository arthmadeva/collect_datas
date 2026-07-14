import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface CollectData {
  nama: string;
  nomor_kartu: string;
  cabang: string;
}

interface VerifikasiKartu {
  nama_cs: string;
  plafon: string;
  collect_data: CollectData;
}

interface KonfirmasiBeli {
  konfirmasi_id: number;
  created_at: string;
  beli: boolean;
  resep: string | null;
  nomor_sp: string | null;
  alamat_kirim: string | null;
  tanggal_kirim_frame: string | null;
  tanggal_kirim_lensa: string | null;
  cek_mutasi: boolean;
  id_form: string;
  verifikasi_kartu: VerifikasiKartu;
}

export default function KeuanganDashboard() {
  const [activeTab, setActiveTab] = useState<"aktual" | "silang">("aktual");
  
  // Queues
  const [aktualQueue, setAktualQueue] = useState<KonfirmasiBeli[]>([]);
  const [silangQueue, setSilangQueue] = useState<KonfirmasiBeli[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State: Aktual
  const [selectedAktualTx, setSelectedAktualTx] = useState<KonfirmasiBeli | null>(null);
  const [actualValue, setActualValue] = useState("");
  const [accPusatActual, setAccPusatActual] = useState(true);
  const [noAccPusatActual, setNoAccPusatActual] = useState("");
  const [aktualSubmitLoading, setAktualSubmitLoading] = useState(false);
  const [aktualFormError, setAktualFormError] = useState<string | null>(null);

  // Form State: Bayar Silang
  const [selectedSilangTx, setSelectedSilangTx] = useState<KonfirmasiBeli | null>(null);
  const [nomorBayarSilang, setNomorBayarSilang] = useState("");
  const [lebihPlafon, setLebihPlafon] = useState("");
  const [silangSubmitLoading, setSilangSubmitLoading] = useState(false);
  const [silangFormError, setSilangFormError] = useState<string | null>(null);

  const fetchQueues = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Aktual Queue
      const resAktual = await fetch("/api/konfirmasi-beli?queueType=aktual");
      if (!resAktual.ok) throw new Error("Gagal memuat antrean aktual");
      const dataAktual = await resAktual.json();
      setAktualQueue(dataAktual);

      // Fetch Bayar Silang Queue
      const resSilang = await fetch("/api/konfirmasi-beli?queueType=bayar_silang");
      if (!resSilang.ok) throw new Error("Gagal memuat antrean bayar silang");
      const dataSilang = await resSilang.json();
      setSilangQueue(dataSilang);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  const openAktualModal = (tx: KonfirmasiBeli) => {
    setSelectedAktualTx(tx);
    setActualValue("");
    setAccPusatActual(true);
    setNoAccPusatActual("");
    setAktualFormError(null);
  };

  const handleAktualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAktualTx) return;

    setAktualSubmitLoading(true);
    setAktualFormError(null);

    try {
      const res = await fetch("/api/aktual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          konfirmasi_id: selectedAktualTx.konfirmasi_id,
          actual: actualValue,
          acc_pusat_actual: accPusatActual,
          no_acc_pusat_actual: noAccPusatActual,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan aktual pembayaran");
      }

      setSelectedAktualTx(null);
      fetchQueues();
    } catch (err: any) {
      setAktualFormError(err.message);
    } finally {
      setAktualSubmitLoading(false);
    }
  };

  const openSilangModal = (tx: KonfirmasiBeli) => {
    setSelectedSilangTx(tx);
    setNomorBayarSilang("");
    setLebihPlafon("");
    setSilangFormError(null);
  };

  const handleSilangSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSilangTx) return;

    setSilangSubmitLoading(true);
    setSilangFormError(null);

    try {
      const res = await fetch("/api/bayar-silang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          konfirmasi_id: selectedSilangTx.konfirmasi_id,
          nomor_bayar_silang: nomorBayarSilang,
          lebih_plafon: lebihPlafon,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan data bayar silang");
      }

      setSelectedSilangTx(null);
      fetchQueues();
    } catch (err: any) {
      setSilangFormError(err.message);
    } finally {
      setSilangSubmitLoading(false);
    }
  };

  return (
    <DashboardLayout activePage="dashboard" role="keuangan" title="Dashboard Keuangan Pusat">
      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800/80 mb-6">
        <button
          onClick={() => setActiveTab("aktual")}
          className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 transition ${
            activeTab === "aktual"
              ? "border-teal-500 text-teal-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          To-Do List Aktual ({aktualQueue.length})
        </button>
        <button
          onClick={() => setActiveTab("silang")}
          className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 transition ${
            activeTab === "silang"
              ? "border-teal-500 text-teal-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          To-Do Bayar Silang ({silangQueue.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-950/30 border border-rose-800/50 rounded-xl text-rose-300 text-sm">
          Error: {error}
        </div>
      ) : activeTab === "aktual" ? (
        /* Aktual Queue Table */
        aktualQueue.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-slate-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Antrean Aktual Selesai!</h3>
            <p className="text-slate-400 text-sm">
              Tidak ada konfirmasi pembelian yang membutuhkan pencatatan aktual pembayaran saat ini.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/70 border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Tgl Konfirmasi</th>
                    <th className="px-6 py-4">ID Form / SP</th>
                    <th className="px-6 py-4">Cabang</th>
                    <th className="px-6 py-4">Nama Konsumen</th>
                    <th className="px-6 py-4">Cek Mutasi</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm text-slate-200">
                  {aktualQueue.map((row) => (
                    <tr key={row.konfirmasi_id} className="hover:bg-slate-900/20 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                        {new Date(row.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-indigo-400 font-bold font-mono">{row.id_form}</div>
                        <div className="text-xs text-slate-400 mt-0.5 font-mono">SP: {row.nomor_sp || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize text-slate-300">
                        {row.verifikasi_kartu?.collect_data?.cabang || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-white">
                          {row.verifikasi_kartu?.collect_data?.nama || "-"}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 font-mono">
                          Card: {row.verifikasi_kartu?.collect_data?.nomor_kartu || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {row.cek_mutasi ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Ya (Bayar Silang Lunas)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/50">
                            Tidak (Bypass)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => openAktualModal(row)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition cursor-pointer"
                        >
                          Catat Aktual
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Bayar Silang Queue Table */
        silangQueue.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-slate-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Antrean Bayar Silang Bersih!</h3>
            <p className="text-slate-400 text-sm">
              Tidak ada data konfirmasi pembelian dengan status cek mutasi aktif yang tertunda saat ini.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/70 border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Tgl Konfirmasi</th>
                    <th className="px-6 py-4">ID Form / SP</th>
                    <th className="px-6 py-4">Cabang</th>
                    <th className="px-6 py-4">Nama Konsumen</th>
                    <th className="px-6 py-4">Plafon CS</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm text-slate-200">
                  {silangQueue.map((row) => (
                    <tr key={row.konfirmasi_id} className="hover:bg-slate-900/20 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                        {new Date(row.created_at).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-indigo-400 font-bold font-mono">{row.id_form}</div>
                        <div className="text-xs text-slate-400 mt-0.5 font-mono">SP: {row.nomor_sp || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap capitalize text-slate-300">
                        {row.verifikasi_kartu?.collect_data?.cabang || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-white">
                          {row.verifikasi_kartu?.collect_data?.nama || "-"}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 font-mono">
                          Card: {row.verifikasi_kartu?.collect_data?.nomor_kartu || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-emerald-400 font-semibold">
                        Rp {Number(row.verifikasi_kartu?.plafon || 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => openSilangModal(row)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white transition cursor-pointer"
                        >
                          Proses Bayar Silang
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Modal 1: Form Catat Aktual */}
      {selectedAktualTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setSelectedAktualTx(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Pencatatan Aktual Transaksi</h3>
            <p className="text-xs text-slate-400 mb-5">
              Konsumen: <span className="font-semibold text-teal-400">{selectedAktualTx.verifikasi_kartu?.collect_data?.nama}</span> | ID Form: <span className="font-mono text-indigo-400">{selectedAktualTx.id_form}</span>
            </p>

            <form onSubmit={handleAktualSubmit} className="space-y-4">
              {aktualFormError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-200 text-xs">
                  {aktualFormError}
                </div>
              )}

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="actual_val">
                  Nilai Aktual Pencairan (Rupiah)
                </label>
                <input
                  id="actual_val"
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                  placeholder="Contoh: 1450000"
                  value={actualValue}
                  onChange={(e) => setActualValue(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="no_acc">
                  Nomor ACC Pusat Aktual
                </label>
                <input
                  id="no_acc"
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                  placeholder="Contoh: ACC-88123"
                  value={noAccPusatActual}
                  onChange={(e) => setNoAccPusatActual(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800/80 rounded-xl p-3.5">
                <input
                  id="acc_pusat"
                  type="checkbox"
                  className="h-4.5 w-4.5 rounded border-slate-800 text-teal-600 focus:ring-teal-500 bg-slate-900 transition"
                  checked={accPusatActual}
                  onChange={(e) => setAccPusatActual(e.target.checked)}
                />
                <label htmlFor="acc_pusat" className="text-slate-300 text-xs select-none">
                  <div className="font-semibold text-white">ACC Pusat Disetujui</div>
                  <div className="text-slate-400 mt-0.5">Transaksi aktual disahkan oleh manajemen pusat keuangan</div>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedAktualTx(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={aktualSubmitLoading}
                  className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white rounded-lg transition disabled:opacity-50"
                >
                  {aktualSubmitLoading ? "Menyimpan..." : "Posting Aktual"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Form Proses Bayar Silang */}
      {selectedSilangTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <button
              onClick={() => setSelectedSilangTx(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Verifikasi Mutasi Bayar Silang</h3>
            <p className="text-xs text-slate-400 mb-5">
              Konsumen: <span className="font-semibold text-teal-400">{selectedSilangTx.verifikasi_kartu?.collect_data?.nama}</span> | Plafon: <span className="font-semibold text-emerald-400">Rp {Number(selectedSilangTx.verifikasi_kartu?.plafon || 0).toLocaleString("id-ID")}</span>
            </p>

            <form onSubmit={handleSilangSubmit} className="space-y-4">
              {silangFormError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-200 text-xs">
                  {silangFormError}
                </div>
              )}

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="no_bayar_silang">
                  Nomor Bukti Bayar Silang (Mutasi)
                </label>
                <input
                  id="no_bayar_silang"
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                  placeholder="Contoh: TRF-SLG-99123"
                  value={nomorBayarSilang}
                  onChange={(e) => setNomorBayarSilang(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="lebih_plafon">
                  Kelebihan Plafon Dibayarkan (Rupiah)
                </label>
                <input
                  id="lebih_plafon"
                  type="text"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                  placeholder="Contoh: 150000"
                  value={lebihPlafon}
                  onChange={(e) => setLebihPlafon(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedSilangTx(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={silangSubmitLoading}
                  className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white rounded-lg transition disabled:opacity-50"
                >
                  {silangSubmitLoading ? "Menyimpan..." : "Validasi Bukti"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
