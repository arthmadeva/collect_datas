import { useState } from "react";
import { type GetServerSideProps } from "next";
import { createPagesServerClient } from "@/utils/supabase/pages-server";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/router";
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
    collect_data: {
      nama: string;
      nomor_kartu: string;
      cabang: string;
    };
  };
  pra_produksi?: { pra_id: number }[];
}

interface PraProduksi {
  pra_id: number;
  konfirmasi_id: number;
  created_at: string;
  tanggal_terima_frame: string;
  sudah_terima_frame: boolean;
  stock: boolean;
  gosok: boolean;
  tanggal_terima_lensa: string;
  konfirmasi_beli: {
    verifikasi_kartu: {
      collect_data: {
        nama: string;
        nomor_kartu: string;
        cabang: string;
      };
    };
  };
  post_produksi?: { post_id: number }[];
}

interface GudangDashboardProps {
  user: {
    email: string;
    role: string;
    cabang: string;
  };
  initialQueuePra: KonfirmasiBeli[];
  initialQueuePost: PraProduksi[];
}

export default function GudangDashboard({
  user,
  initialQueuePra,
  initialQueuePost,
}: GudangDashboardProps) {
  const router = useRouter();
  const supabase = createClient();

  const [queuePra, setQueuePra] = useState<KonfirmasiBeli[]>(initialQueuePra);
  const [queuePost, setQueuePost] = useState<PraProduksi[]>(initialQueuePost);

  // Modals selected objects
  const [selectedTxPra, setSelectedTxPra] = useState<KonfirmasiBeli | null>(null);
  const [selectedTxPost, setSelectedTxPost] = useState<PraProduksi | null>(null);

  // Form states - Pra Produksi
  const [tanggalTerimaFrame, setTanggalTerimaFrame] = useState(new Date().toISOString().split("T")[0]);
  const [sudahTerimaFrame, setSudahTerimaFrame] = useState(false);
  const [stock, setStock] = useState(false);
  const [gosok, setGosok] = useState(false);
  const [tanggalTerimaLensa, setTanggalTerimaLensa] = useState(new Date().toISOString().split("T")[0]);

  // Form states - Post Produksi
  const [noFaktur, setNoFaktur] = useState("");
  const [sudahProduksi, setSudahProduksi] = useState(false);
  const [petugasProduksi, setPetugasProduksi] = useState("");
  const [tanggalSelesaiProduksi, setTanggalSelesaiProduksi] = useState(new Date().toISOString().split("T")[0]);
  const [prosesPengiriman, setProsesPengiriman] = useState(false);
  const [qualityControl, setQualityControl] = useState(false);
  const [resiPengiriman, setResiPengiriman] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const refreshData = async () => {
    // 1. Refresh Pra Queue
    const { data: dataPra, error: errorPra } = await supabase
      .from("konfirmasi_beli")
      .select(`
        *,
        verifikasi_kartu!inner(
          collect_data!inner(
            nama,
            nomor_kartu,
            cabang
          )
        ),
        pra_produksi(pra_id)
      `)
      .eq("beli", true);

    if (!errorPra && dataPra) {
      const filteredPra = dataPra.filter(
        (row: any) => !row.pra_produksi || row.pra_produksi.length === 0
      );
      setQueuePra(filteredPra as any[]);
    }

    // 2. Refresh Post Queue
    const { data: dataPost, error: errorPost } = await supabase
      .from("pra_produksi")
      .select(`
        *,
        konfirmasi_beli!inner(
          verifikasi_kartu!inner(
            collect_data!inner(
              nama,
              nomor_kartu,
              cabang
            )
          )
        ),
        post_produksi(post_id)
      `);

    if (!errorPost && dataPost) {
      const filteredPost = dataPost.filter(
        (row: any) => !row.post_produksi || row.post_produksi.length === 0
      );
      setQueuePost(filteredPost as any[]);
    }
  };

  const handleOpenPraForm = (tx: KonfirmasiBeli) => {
    setSelectedTxPra(tx);
    const today = new Date().toISOString().split("T")[0];
    setTanggalTerimaFrame(today);
    setSudahTerimaFrame(false);
    setStock(false);
    setGosok(false);
    setTanggalTerimaLensa(today);
    setErrorMsg("");
  };

  const handleSavePra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxPra) return;

    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.from("pra_produksi").insert([
      {
        konfirmasi_id: selectedTxPra.konfirmasi_id,
        tanggal_terima_frame: tanggalTerimaFrame || null,
        sudah_terima_frame: sudahTerimaFrame,
        stock: stock,
        gosok: gosok,
        tanggal_terima_lensa: tanggalTerimaLensa || null,
      },
    ]);

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setSelectedTxPra(null);
      setLoading(false);
      await refreshData();
    }
  };

  const handleOpenPostForm = (tx: PraProduksi) => {
    setSelectedTxPost(tx);
    setNoFaktur("");
    setSudahProduksi(false);
    setPetugasProduksi("");
    setTanggalSelesaiProduksi(new Date().toISOString().split("T")[0]);
    setProsesPengiriman(false);
    setQualityControl(false);
    setResiPengiriman("");
    setErrorMsg("");
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxPost) return;

    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.from("post_produksi").insert([
      {
        pra_id: selectedTxPost.pra_id,
        no_faktur: noFaktur,
        sudah_produksi: sudahProduksi,
        petugas_produksi: petugasProduksi,
        tanggal_selesai_produksi: tanggalSelesaiProduksi || null,
        proses_pengiriman: prosesPengiriman,
        quality_control: qualityControl,
        resi_pengiriman: resiPengiriman || null,
      },
    ]);

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      setSelectedTxPost(null);
      setLoading(false);
      await refreshData();
      router.push("/gudang/transaction");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-8">
        {/* Header Section */}
        <div className="border-b border-slate-850 pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-white">Gudang Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Pengelolaan alur logistik pra-produksi (penerimaan frame/lensa) dan post-produksi (pembikinan & pengiriman resi).
          </p>
        </div>

        {/* SECTION 1: ANTREAN PRA-PRODUKSI */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-indigo-400 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>1. Antrean Pra-Produksi (Terima Frame & Lensa)</span>
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              {queuePra.length} Antrean
            </span>
          </div>

          {queuePra.length === 0 ? (
            <div className="py-8 text-center bg-slate-900/10 border border-slate-850 rounded-xl text-slate-500 text-sm">
              Tidak ada antrean pra-produksi.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-900/35">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-6">ID Konfirmasi</th>
                    <th className="py-3 px-6">Konsumen</th>
                    <th className="py-3 px-6">Cabang</th>
                    <th className="py-3 px-6">Rencana Kirim</th>
                    <th className="py-3 px-6">SP / Resep</th>
                    <th className="py-3 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 text-sm">
                  {queuePra.map((tx) => (
                    <tr key={tx.konfirmasi_id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-6 font-mono text-slate-450">#K-{tx.konfirmasi_id}</td>
                      <td className="py-3 px-6 font-medium text-white">{tx.verifikasi_kartu?.collect_data?.nama}</td>
                      <td className="py-3 px-6 uppercase font-semibold text-xs text-indigo-400">
                        {tx.verifikasi_kartu?.collect_data?.cabang}
                      </td>
                      <td className="py-3 px-6 text-xs text-slate-400">
                        <div>Frame: {tx.tanggal_kirim_frame || "-"}</div>
                        <div>Lensa: {tx.tanggal_kirim_lensa || "-"}</div>
                      </td>
                      <td className="py-3 px-6 text-xs text-slate-405">
                        <div>SP: {tx.nomor_sp || "-"}</div>
                        <div>Resep: {tx.resep || "-"}</div>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() => handleOpenPraForm(tx)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500 hover:bg-indigo-650 text-white transition cursor-pointer"
                        >
                          Proses Pra-Produksi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 2: ANTREAN POST-PRODUKSI */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-emerald-400 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>2. Antrean Post-Produksi (Proses Faktur & Kirim)</span>
            </h2>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              {queuePost.length} Antrean
            </span>
          </div>

          {queuePost.length === 0 ? (
            <div className="py-8 text-center bg-slate-900/10 border border-slate-850 rounded-xl text-slate-500 text-sm">
              Tidak ada antrean post-produksi.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-900/35">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-850 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-6">ID Pra</th>
                    <th className="py-3 px-6">Konsumen</th>
                    <th className="py-3 px-6">Cabang</th>
                    <th className="py-3 px-6">Penerimaan Logistik</th>
                    <th className="py-3 px-6">Jenis Lensa</th>
                    <th className="py-3 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/60 text-sm">
                  {queuePost.map((item) => {
                    const client = item.konfirmasi_beli?.verifikasi_kartu?.collect_data;
                    return (
                      <tr key={item.pra_id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3 px-6 font-mono text-slate-450">#P-{item.pra_id}</td>
                        <td className="py-3 px-6 font-medium text-white">{client?.nama}</td>
                        <td className="py-3 px-6 uppercase font-semibold text-xs text-indigo-400">
                          {client?.cabang}
                        </td>
                        <td className="py-3 px-6 text-xs text-slate-450">
                          <div>
                            Frame: {item.sudah_terima_frame ? "Diterima" : "Belum"}{" "}
                            {item.tanggal_terima_frame && `(${item.tanggal_terima_frame})`}
                          </div>
                          <div>Terima Lensa: {item.tanggal_terima_lensa || "-"}</div>
                        </td>
                        <td className="py-3 px-6 text-xs">
                          <div className="space-x-2">
                            {item.stock && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold text-[10px]">
                                Stock
                              </span>
                            )}
                            {item.gosok && (
                              <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-semibold text-[10px]">
                                Gosok
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-6 text-right">
                          <button
                            onClick={() => handleOpenPostForm(item)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500 hover:bg-indigo-650 text-white transition cursor-pointer"
                          >
                            Proses Post-Produksi
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* FORM MODAL PRA-PRODUKSI */}
      {selectedTxPra && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Form Pra-Produksi</h3>
                <p className="text-xs text-slate-400 mt-1">
                  ID Konfirmasi #{selectedTxPra.konfirmasi_id} | Pelanggan: {selectedTxPra.verifikasi_kartu?.collect_data?.nama}
                </p>
              </div>
              <button
                onClick={() => setSelectedTxPra(null)}
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

            <form onSubmit={handleSavePra} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tgl Terima Frame
                  </label>
                  <input
                    type="date"
                    value={tanggalTerimaFrame}
                    onChange={(e) => setTanggalTerimaFrame(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Tgl Terima Lensa
                  </label>
                  <input
                    type="date"
                    value={tanggalTerimaLensa}
                    onChange={(e) => setTanggalTerimaLensa(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="terimaFrame"
                  checked={sudahTerimaFrame}
                  onChange={(e) => setSudahTerimaFrame(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-850"
                />
                <label htmlFor="terimaFrame" className="text-sm font-medium text-slate-350 select-none">
                  Sudah Terima Frame Fisik
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isStock"
                    checked={stock}
                    onChange={(e) => setStock(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-850"
                  />
                  <label htmlFor="isStock" className="text-sm font-medium text-slate-350 select-none">
                    Lensa Stock
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isGosok"
                    checked={gosok}
                    onChange={(e) => setGosok(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-850"
                  />
                  <label htmlFor="isGosok" className="text-sm font-medium text-slate-350 select-none">
                    Lensa Gosok
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setSelectedTxPra(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-950 text-slate-300 font-medium text-sm transition text-center cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm transition shadow-lg shadow-indigo-500/10 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>Simpan Data</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FORM MODAL POST-PRODUKSI */}
      {selectedTxPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Form Post-Produksi & Pengiriman</h3>
                <p className="text-xs text-slate-400 mt-1">
                  ID Pra-Produksi #{selectedTxPost.pra_id} | Pelanggan: {selectedTxPost.konfirmasi_beli?.verifikasi_kartu?.collect_data?.nama}
                </p>
              </div>
              <button
                onClick={() => setSelectedTxPost(null)}
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

            <form onSubmit={handleSavePost} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nomor Faktur
                  </label>
                  <input
                    type="text"
                    value={noFaktur}
                    onChange={(e) => setNoFaktur(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                    placeholder="Nomor Faktur Produksi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Petugas Produksi
                  </label>
                  <input
                    type="text"
                    value={petugasProduksi}
                    onChange={(e) => setPetugasProduksi(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                    placeholder="Nama Operator"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tanggal Selesai Produksi
                </label>
                <input
                  type="date"
                  value={tanggalSelesaiProduksi}
                  onChange={(e) => setTanggalSelesaiProduksi(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="sudahProd"
                    checked={sudahProduksi}
                    onChange={(e) => setSudahProduksi(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-850"
                  />
                  <label htmlFor="sudahProd" className="text-sm font-medium text-slate-350 select-none">
                    Sudah Produksi
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isQc"
                    checked={qualityControl}
                    onChange={(e) => setQualityControl(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-850"
                  />
                  <label htmlFor="isQc" className="text-sm font-medium text-slate-350 select-none">
                    Lolos Quality Control (QC)
                  </label>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="kirimProses"
                  checked={prosesPengiriman}
                  onChange={(e) => setProsesPengiriman(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-850"
                />
                <label htmlFor="kirimProses" className="text-sm font-medium text-slate-350 select-none">
                  Siap Dikirim / Proses Pengiriman
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nomor Resi Pengiriman
                </label>
                <input
                  type="text"
                  value={resiPengiriman}
                  onChange={(e) => setResiPengiriman(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none text-slate-100 transition"
                  placeholder="e.g. SHPE-xxxxxxxxx (kosongkan jika belum dikirim)"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setSelectedTxPost(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-950 text-slate-300 font-medium text-sm transition text-center cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm transition shadow-lg shadow-indigo-500/10 disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>Simpan Data</span>
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

  const role = session.user.user_metadata?.role || "gudang";

  if (role !== "gudang") {
    return {
      redirect: {
        destination: `/${role}/dashboard`,
        permanent: false,
      },
    };
  }

  // 1. Fetch Pra Queue (konfirmasi_beli NOT in pra_produksi and beli = true)
  const { data: dataPra, error: errorPra } = await supabase
    .from("konfirmasi_beli")
    .select(`
      *,
      verifikasi_kartu!inner(
        collect_data!inner(
          nama,
          nomor_kartu,
          cabang
        )
      ),
      pra_produksi(pra_id)
    `)
    .eq("beli", true);

  const initialQueuePra = errorPra || !dataPra ? [] : dataPra.filter(
    (row: any) => !row.pra_produksi || row.pra_produksi.length === 0
  );

  // 2. Fetch Post Queue (pra_produksi NOT in post_produksi)
  const { data: dataPost, error: errorPost } = await supabase
    .from("pra_produksi")
    .select(`
      *,
      konfirmasi_beli!inner(
        verifikasi_kartu!inner(
          collect_data!inner(
            nama,
            nomor_kartu,
            cabang
          )
        )
      ),
      post_produksi(post_id)
    `);

  const initialQueuePost = errorPost || !dataPost ? [] : dataPost.filter(
    (row: any) => !row.post_produksi || row.post_produksi.length === 0
  );

  return {
    props: {
      user: {
        email: session.user.email,
        role,
        cabang: "",
      },
      initialQueuePra,
      initialQueuePost,
    },
  };
};
