import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";

interface CollectData {
  nama: string;
  nomor_kartu: string;
  cabang: string;
}

interface VerifikasiKartu {
  collect_data: CollectData;
}

interface KonfirmasiBeli {
  konfirmasi_id: number;
  created_at: string;
  beli: boolean;
  resep: string | null;
  nomor_sp: string | null;
  id_form: string;
  verifikasi_kartu: VerifikasiKartu;
}

interface PraProduksiRecord {
  pra_id: number;
  konfirmasi_id: number;
  created_at: string;
  tanggal_terima_frame: string;
  sudah_terima_frame: boolean;
  stock: boolean;
  gosok: boolean;
  tanggal_terima_lensa: string;
  konfirmasi_beli: KonfirmasiBeli;
}

export default function GudangDashboard() {
  const [activeTab, setActiveTab] = useState<"pra" | "post">("pra");

  // Queues
  const [praQueue, setPraQueue] = useState<KonfirmasiBeli[]>([]);
  const [postQueue, setPostQueue] = useState<PraProduksiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State: Pra-Produksi
  const [selectedPraTx, setSelectedPraTx] = useState<KonfirmasiBeli | null>(null);
  const [tanggalTerimaFrame, setTanggalTerimaFrame] = useState("");
  const [sudahTerimaFrame, setSudahTerimaFrame] = useState(true);
  const [stock, setStock] = useState(true);
  const [gosok, setGosok] = useState(false);
  const [tanggalTerimaLensa, setTanggalTerimaLensa] = useState("");
  const [praSubmitLoading, setPraSubmitLoading] = useState(false);
  const [praFormError, setPraFormError] = useState<string | null>(null);

  // Form State: Post-Produksi
  const [selectedPostTx, setSelectedPostTx] = useState<PraProduksiRecord | null>(null);
  const [noFaktur, setNoFaktur] = useState("");
  const [sudahProduksi, setSudahProduksi] = useState(true);
  const [petugasProduksi, setPetugasProduksi] = useState("");
  const [tanggalSelesaiProduksi, setTanggalSelesaiProduksi] = useState("");
  const [prosesPengiriman, setProsesPengiriman] = useState(true);
  const [qualityControl, setQualityControl] = useState(true);
  const [resiPengiriman, setResiPengiriman] = useState("");
  const [postSubmitLoading, setPostSubmitLoading] = useState(false);
  const [postFormError, setPostFormError] = useState<string | null>(null);

  const fetchQueues = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch Pra-Produksi Queue (from konfirmasi_beli pending pra_produksi)
      const resPra = await fetch("/api/konfirmasi-beli?queueType=pra_produksi");
      if (!resPra.ok) throw new Error("Gagal memuat antrean pra-produksi");
      const dataPra = await resPra.json();
      setPraQueue(dataPra);

      // Fetch Post-Produksi Queue (from pra_produksi pending post_produksi)
      const resPost = await fetch("/api/pra-produksi?queue=true");
      if (!resPost.ok) throw new Error("Gagal memuat antrean post-produksi");
      const dataPost = await resPost.json();
      setPostQueue(dataPost);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  const openPraModal = (tx: KonfirmasiBeli) => {
    setSelectedPraTx(tx);
    const today = new Date().toISOString().split("T")[0];
    setTanggalTerimaFrame(today);
    setTanggalTerimaLensa(today);
    setSudahTerimaFrame(true);
    setStock(true);
    setGosok(false);
    setPraFormError(null);
  };

  const handlePraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPraTx) return;

    setPraSubmitLoading(true);
    setPraFormError(null);

    try {
      const res = await fetch("/api/pra-produksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          konfirmasi_id: selectedPraTx.konfirmasi_id,
          tanggal_terima_frame: tanggalTerimaFrame,
          sudah_terima_frame: sudahTerimaFrame,
          stock,
          gosok,
          tanggal_terima_lensa: tanggalTerimaLensa,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan data pra-produksi");
      }

      setSelectedPraTx(null);
      fetchQueues();
    } catch (err: any) {
      setPraFormError(err.message);
    } finally {
      setPraSubmitLoading(false);
    }
  };

  const openPostModal = (tx: PraProduksiRecord) => {
    setSelectedPostTx(tx);
    setNoFaktur("");
    setSudahProduksi(true);
    setPetugasProduksi("");
    const today = new Date().toISOString().split("T")[0];
    setTanggalSelesaiProduction(today);
    setProsesPengiriman(true);
    setQualityControl(true);
    setResiPengiriman("");
    setPostFormError(null);
  };

  const setTanggalSelesaiProduction = (val: string) => {
    setTanggalSelesaiProduksi(val);
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostTx) return;

    setPostSubmitLoading(true);
    setPostFormError(null);

    try {
      const res = await fetch("/api/post-produksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pra_id: selectedPostTx.pra_id,
          no_faktur: noFaktur,
          sudah_produksi: sudahProduksi,
          petugas_produksi: petugasProduksi,
          tanggal_selesai_produksi: tanggalSelesaiProduksi,
          proses_pengiriman: prosesPengiriman,
          quality_control: qualityControl,
          resi_pengiriman: resiPengiriman,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan data post-produksi");
      }

      setSelectedPostTx(null);
      fetchQueues();
    } catch (err: any) {
      setPostFormError(err.message);
    } finally {
      setPostSubmitLoading(false);
    }
  };

  return (
    <DashboardLayout activePage="dashboard" role="gudang" title="Dashboard Logistik Gudang">
      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 mb-6">
        <button
          onClick={() => setActiveTab("pra")}
          className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 transition ${
            activeTab === "pra"
              ? "border-teal-500 text-teal-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Antrean Pra-Produksi ({praQueue.length})
        </button>
        <button
          onClick={() => setActiveTab("post")}
          className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 transition ${
            activeTab === "post"
              ? "border-teal-500 text-teal-400 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Antrean Post-Produksi ({postQueue.length})
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
      ) : activeTab === "pra" ? (
        /* Pra-Produksi Queue Table */
        praQueue.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-slate-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Antrean Pra-Produksi Bersih!</h3>
            <p className="text-slate-400 text-sm">
              Semua kacamata terkonfirmasi saat ini telah diproses status penerimaan lensanya ke pra-produksi.
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
                    <th className="px-6 py-4">Resep Kacamata</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm text-slate-200">
                  {praQueue.map((row) => (
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
                      <td className="px-6 py-4 text-slate-300 max-w-xs truncate">
                        {row.resep || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => openPraModal(row)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition cursor-pointer"
                        >
                          Terima Frame/Lensa
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
        /* Post-Produksi Queue Table */
        postQueue.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-2xl mx-auto shadow-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-slate-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Antrean Post-Produksi Bersih!</h3>
            <p className="text-slate-400 text-sm">
              Semua item pra-produksi saat ini telah diselesaikan produksinya dan diberikan nomor faktur/resi kirim.
            </p>
          </div>
        ) : (
          <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/70 border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Tgl Pra-Prod</th>
                    <th className="px-6 py-4">ID Form</th>
                    <th className="px-6 py-4">Nama Konsumen</th>
                    <th className="px-6 py-4">Kondisi Frame</th>
                    <th className="px-6 py-4">Status Lensa</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-sm text-slate-200">
                  {postQueue.map((row) => (
                    <tr key={row.pra_id} className="hover:bg-slate-900/20 transition">
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
                        <div className="font-semibold text-white">
                          {row.konfirmasi_beli?.verifikasi_kartu?.collect_data?.nama || "-"}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 capitalize">
                          Cabang: {row.konfirmasi_beli?.verifikasi_kartu?.collect_data?.cabang || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {row.sudah_terima_frame ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Frame Diterima ({row.tanggal_terima_frame})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            Pending Frame
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex items-center w-max px-2 py-0.5 rounded text-xs font-semibold ${
                            row.stock ? "bg-blue-500/10 text-blue-300 border border-blue-500/20" : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}>
                            Lensa: {row.stock ? "Stock" : "Bukan Stock"}
                          </span>
                          <span className={`inline-flex items-center w-max px-2 py-0.5 rounded text-xs font-semibold ${
                            row.gosok ? "bg-purple-500/10 text-purple-300 border border-purple-500/20" : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}>
                            Proses: {row.gosok ? "Gosok" : "Pasang Langsung"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => openPostModal(row)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-500 hover:bg-indigo-400 text-white transition cursor-pointer"
                        >
                          Selesaikan Produksi
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

      {/* Modal 1: Form Pra-Produksi */}
      {selectedPraTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setSelectedPraTx(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Pra-Produksi: Terima Frame & Lensa</h3>
            <p className="text-xs text-slate-400 mb-5">
              ID Form: <span className="font-mono text-indigo-400">{selectedPraTx.id_form}</span> | Resep: <span className="text-teal-400 font-semibold">{selectedPraTx.resep || "-"}</span>
            </p>

            <form onSubmit={handlePraSubmit} className="space-y-4">
              {praFormError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-200 text-xs">
                  {praFormError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="tgl_trm_frame">
                    Tgl Terima Frame
                  </label>
                  <input
                    id="tgl_trm_frame"
                    type="date"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                    value={tanggalTerimaFrame}
                    onChange={(e) => setTanggalTerimaFrame(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="tgl_trm_lensa">
                    Tgl Terima Lensa
                  </label>
                  <input
                    id="tgl_trm_lensa"
                    type="date"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                    value={tanggalTerimaLensa}
                    onChange={(e) => setTanggalTerimaLensa(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                <input
                  id="sudah_trm_frame"
                  type="checkbox"
                  className="h-4.5 w-4.5 rounded border-slate-800 text-teal-600 focus:ring-teal-500 bg-slate-900 transition"
                  checked={sudahTerimaFrame}
                  onChange={(e) => setSudahTerimaFrame(e.target.checked)}
                />
                <label htmlFor="sudah_trm_frame" className="text-slate-300 text-xs select-none">
                  <div className="font-semibold text-white">Fisik Frame Sudah Diterima</div>
                  <div className="text-slate-400 mt-0.5">Frame kacamata fisik telah tiba di workshop produksi</div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <input
                    id="stock_lensa"
                    type="checkbox"
                    className="h-4.5 w-4.5 rounded border-slate-800 text-teal-600 focus:ring-teal-500 bg-slate-900 transition"
                    checked={stock}
                    onChange={(e) => setStock(e.target.checked)}
                  />
                  <label htmlFor="stock_lensa" className="text-slate-300 text-xs select-none">
                    <div className="font-semibold text-white">Lensa Stock</div>
                    <div className="text-slate-400 mt-0.5">Lensa tersedia di gudang</div>
                  </label>
                </div>

                <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <input
                    id="gosok_lensa"
                    type="checkbox"
                    className="h-4.5 w-4.5 rounded border-slate-800 text-teal-600 focus:ring-teal-500 bg-slate-900 transition"
                    checked={gosok}
                    onChange={(e) => setGosok(e.target.checked)}
                  />
                  <label htmlFor="gosok_lensa" className="text-slate-300 text-xs select-none">
                    <div className="font-semibold text-white">Proses Gosok</div>
                    <div className="text-slate-400 mt-0.5">Lensa butuh dilab/digosok</div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedPraTx(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={praSubmitLoading}
                  className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white rounded-lg transition disabled:opacity-50"
                >
                  {praSubmitLoading ? "Menyimpan..." : "Posting Pra-Produksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Form Post-Produksi */}
      {selectedPostTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setSelectedPostTx(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Post-Produksi: Selesaikan Pengemasan & Resi</h3>
            <p className="text-xs text-slate-400 mb-5">
              Konsumen: <span className="font-semibold text-teal-400">{selectedPostTx.konfirmasi_beli?.verifikasi_kartu?.collect_data?.nama}</span> | ID Form: <span className="font-mono text-indigo-400">{selectedPostTx.konfirmasi_beli?.id_form}</span>
            </p>

            <form onSubmit={handlePostSubmit} className="space-y-4">
              {postFormError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-lg text-rose-200 text-xs">
                  {postFormError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="no_faktur">
                    Nomor Faktur Produksi
                  </label>
                  <input
                    id="no_faktur"
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                    placeholder="Contoh: FKT-99123"
                    value={noFaktur}
                    onChange={(e) => setNoFaktur(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="petugas">
                    Petugas Workshop / Lab
                  </label>
                  <input
                    id="petugas"
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                    placeholder="Nama optisi..."
                    value={petugasProduksi}
                    onChange={(e) => setPetugasProduksi(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="tgl_selesai">
                    Tanggal Selesai Produksi
                  </label>
                  <input
                    id="tgl_selesai"
                    type="date"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                    value={tanggalSelesaiProduksi}
                    onChange={(e) => setTanggalSelesaiProduksi(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-xs font-medium mb-1" htmlFor="resi">
                    Nomor Resi Pengiriman
                  </label>
                  <input
                    id="resi"
                    type="text"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-white text-sm rounded-lg px-3 py-2 outline-none transition"
                    placeholder="Contoh: JNE-9938123812"
                    value={resiPengiriman}
                    onChange={(e) => setResiPengiriman(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <input
                    id="sudah_prod"
                    type="checkbox"
                    className="h-4.5 w-4.5 rounded border-slate-800 text-teal-600 focus:ring-teal-500 bg-slate-900 transition"
                    checked={sudahProduksi}
                    onChange={(e) => setSudahProduksi(e.target.checked)}
                  />
                  <label htmlFor="sudah_prod" className="text-slate-300 text-xs select-none">
                    <div className="font-semibold text-white">Selesai Produksi</div>
                    <div className="text-slate-400 mt-0.5">Produksi optik tuntas</div>
                  </label>
                </div>

                <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                  <input
                    id="qc_ok"
                    type="checkbox"
                    className="h-4.5 w-4.5 rounded border-slate-800 text-teal-600 focus:ring-teal-500 bg-slate-900 transition"
                    checked={qualityControl}
                    onChange={(e) => setQualityControl(e.target.checked)}
                  />
                  <label htmlFor="qc_ok" className="text-slate-300 text-xs select-none">
                    <div className="font-semibold text-white">Quality Control OK</div>
                    <div className="text-slate-400 mt-0.5">Lulus uji parameter optik</div>
                  </label>
                </div>
              </div>

              <div className="flex items-center space-x-3 bg-slate-950 border border-slate-800/80 rounded-xl p-3">
                <input
                  id="proses_kirim"
                  type="checkbox"
                  className="h-4.5 w-4.5 rounded border-slate-800 text-teal-600 focus:ring-teal-500 bg-slate-900 transition"
                  checked={prosesPengiriman}
                  onChange={(e) => setProsesPengiriman(e.target.checked)}
                />
                <label htmlFor="proses_kirim" className="text-slate-300 text-xs select-none">
                  <div className="font-semibold text-white">Masuk Proses Pengiriman</div>
                  <div className="text-slate-400 mt-0.5">Paket fisik diserahkan ke kurir logistik</div>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedPostTx(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={postSubmitLoading}
                  className="px-5 py-2 text-sm font-bold bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white rounded-lg transition disabled:opacity-50"
                >
                  {postSubmitLoading ? "Menyimpan..." : "Posting Post-Produksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
